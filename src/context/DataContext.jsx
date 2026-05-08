import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FOLLOW_UP_DAYS } from '../utils/constants';
import { addDaysToDate, toISODateString } from '../utils/dateUtils';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState({ roles: [], candidates: [], talentPool: [] });
  const [loading, setLoading] = useState(true);
  const dataRef = useRef(data);

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(d => {
        setData(d);
        dataRef.current = d;
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const persist = useCallback((newData) => {
    fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    }).catch(console.error);
  }, []);

  const commit = useCallback((newData) => {
    dataRef.current = newData;
    setData(newData);
    persist(newData);
  }, [persist]);

  const addRole = useCallback((roleData) => {
    const now = new Date().toISOString();
    const role = {
      id: uuidv4(),
      jobTitle: roleData.jobTitle,
      company: roleData.company,
      contactName: roleData.contactName || '',
      status: roleData.status || 'Active',
      noGoReason: null,
      createdDate: now,
      lastActivity: now,
    };
    commit({ ...dataRef.current, roles: [...dataRef.current.roles, role] });
    return role;
  }, [commit]);

  const updateRole = useCallback((roleId, updates) => {
    const now = new Date().toISOString();
    commit({
      ...dataRef.current,
      roles: dataRef.current.roles.map(r =>
        r.id === roleId ? { ...r, ...updates, lastActivity: now } : r
      ),
    });
  }, [commit]);

  const addCandidate = useCallback((candidateData) => {
    const now = new Date().toISOString();
    const stage = candidateData.stage || 'Submitted';
    const followUpDays = FOLLOW_UP_DAYS[stage];
    const followUpDate = candidateData.followUpDate ||
      (followUpDays ? toISODateString(addDaysToDate(new Date(), followUpDays)) : null);

    const candidate = {
      id: uuidv4(),
      roleId: candidateData.roleId,
      name: candidateData.name,
      stage,
      flag: candidateData.flag || 'Active',
      followUpDate,
      notes: candidateData.notes || '',
      employerFeedback: candidateData.employerFeedback || '',
      stageEnteredDate: now,
      activityLog: [{ timestamp: now, entry: `Added to pipeline at stage: ${stage}` }],
      rejectionReason: null,
    };

    commit({
      ...dataRef.current,
      candidates: [...dataRef.current.candidates, candidate],
      roles: dataRef.current.roles.map(r =>
        r.id === candidateData.roleId ? { ...r, lastActivity: now } : r
      ),
    });
    return candidate;
  }, [commit]);

  const updateCandidate = useCallback((candidateId, updates) => {
    const now = new Date().toISOString();
    const curr = dataRef.current.candidates.find(c => c.id === candidateId);
    if (!curr) return;

    const logEntries = [];

    if (updates.stage !== undefined && updates.stage !== curr.stage) {
      logEntries.push({ timestamp: now, entry: `Stage changed: ${curr.stage} → ${updates.stage}` });
    }
    if (updates.flag !== undefined && updates.flag !== curr.flag) {
      logEntries.push({ timestamp: now, entry: `Flag set to ${updates.flag}` });
    }
    if (updates.followUpDate !== undefined && updates.followUpDate !== curr.followUpDate) {
      const val = updates.followUpDate || 'cleared';
      logEntries.push({ timestamp: now, entry: `Follow-up date set to ${val}` });
    }
    if (updates.notes !== undefined && updates.notes !== curr.notes) {
      logEntries.push({ timestamp: now, entry: 'Notes updated' });
    }
    if (updates.employerFeedback !== undefined && updates.employerFeedback !== curr.employerFeedback) {
      logEntries.push({ timestamp: now, entry: 'Employer feedback updated' });
    }
    if (updates.rejectionReason !== undefined && updates.rejectionReason !== curr.rejectionReason) {
      logEntries.push({ timestamp: now, entry: `Rejection reason: ${updates.rejectionReason}` });
    }

    const stageChanged = updates.stage && updates.stage !== curr.stage;
    const updated = {
      ...curr,
      ...updates,
      ...(stageChanged ? { stageEnteredDate: now } : {}),
      activityLog: [...curr.activityLog, ...logEntries],
    };

    commit({
      ...dataRef.current,
      candidates: dataRef.current.candidates.map(c => c.id === candidateId ? updated : c),
      roles: dataRef.current.roles.map(r =>
        r.id === curr.roleId ? { ...r, lastActivity: now } : r
      ),
    });
    return updated;
  }, [commit]);

  const deleteCandidate = useCallback((candidateId) => {
    commit({
      ...dataRef.current,
      candidates: dataRef.current.candidates.filter(c => c.id !== candidateId),
    });
  }, [commit]);

  const addToTalentPool = useCallback((candidateId) => {
    const candidate = dataRef.current.candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    const role = dataRef.current.roles.find(r => r.id === candidate.roleId);
    const alreadySaved = dataRef.current.talentPool.some(t => t.candidateId === candidateId);
    if (alreadySaved) return;

    const entry = {
      id: uuidv4(),
      candidateId,
      candidateName: candidate.name,
      savedAt: new Date().toISOString(),
      savedFromRoleId: candidate.roleId,
      savedFromRole: role ? `${role.jobTitle} at ${role.company}` : 'Unknown Role',
      notes: candidate.notes,
      stage: candidate.stage,
    };
    commit({
      ...dataRef.current,
      talentPool: [...dataRef.current.talentPool, entry],
    });
  }, [commit]);

  const removeFromTalentPool = useCallback((entryId) => {
    commit({
      ...dataRef.current,
      talentPool: dataRef.current.talentPool.filter(t => t.id !== entryId),
    });
  }, [commit]);

  const addFromTalentPool = useCallback((talentEntryId, roleId) => {
    const entry = dataRef.current.talentPool.find(t => t.id === talentEntryId);
    if (!entry) return null;

    const now = new Date().toISOString();
    const followUpDays = FOLLOW_UP_DAYS['Submitted'];
    const candidate = {
      id: uuidv4(),
      roleId,
      name: entry.candidateName,
      stage: 'Submitted',
      flag: 'Active',
      followUpDate: followUpDays ? toISODateString(addDaysToDate(new Date(), followUpDays)) : null,
      notes: entry.notes,
      employerFeedback: '',
      stageEnteredDate: now,
      activityLog: [
        { timestamp: now, entry: `Added from Talent Pool (was: ${entry.stage} at ${entry.savedFromRole})` },
      ],
      rejectionReason: null,
    };

    commit({
      ...dataRef.current,
      candidates: [...dataRef.current.candidates, candidate],
      roles: dataRef.current.roles.map(r =>
        r.id === roleId ? { ...r, lastActivity: now } : r
      ),
    });
    return candidate;
  }, [commit]);

  return (
    <DataContext.Provider value={{
      data,
      loading,
      addRole,
      updateRole,
      addCandidate,
      updateCandidate,
      deleteCandidate,
      addToTalentPool,
      removeFromTalentPool,
      addFromTalentPool,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
