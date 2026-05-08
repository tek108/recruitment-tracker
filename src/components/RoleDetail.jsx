import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../App';
import {
  formatShortDate, daysSince, isOverdue, suggestFollowUpDate,
} from '../utils/dateUtils';
import {
  PIPELINE_STAGES, TERMINAL_STAGES, STAGE_COLORS, FLAG_COLORS,
  STATUS_COLORS, ROLE_STATUSES, NO_GO_REASONS,
} from '../utils/constants';

function HealthDot({ health }) {
  const c = { green: 'bg-green-500', yellow: 'bg-yellow-400', red: 'bg-red-500' };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${c[health] || 'bg-gray-400'}`} />;
}

function getRoleHealth(role) {
  if (role.status === 'No Go' || role.status === 'Filled') return 'red';
  return daysSince(role.lastActivity) >= 7 ? 'yellow' : 'green';
}

function AddCandidateModal({ roleId, onClose, onSave, talentPool }) {
  const [tab, setTab] = useState('new');
  const [form, setForm] = useState({ name: '', notes: '', followUpDate: suggestFollowUpDate('Submitted') || '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function submitNew(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ roleId, name: form.name.trim(), notes: form.notes, followUpDate: form.followUpDate || null });
    onClose();
  }

  const eligible = talentPool.filter(t => t.roleId !== roleId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Candidate</h3>

        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          {['new', 'pool'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'new' ? 'New Candidate' : `From Talent Pool (${eligible.length})`}
            </button>
          ))}
        </div>

        {tab === 'new' ? (
          <form onSubmit={submitNew} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input
                autoFocus required
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Candidate name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={e => set('followUpDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Add</button>
            </div>
          </form>
        ) : (
          <div>
            {eligible.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 italic">No candidates in talent pool yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {eligible.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => { onSave({ fromPool: true, entryId: entry.id }); onClose(); }}
                    className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800 text-sm">{entry.candidateName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{entry.savedFromRole} · was {entry.stage}</p>
                    {entry.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.notes}</p>}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="mt-4 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusModal({ role, onClose, onSave }) {
  const [status, setStatus] = useState(role.status);
  const [noGoReason, setNoGoReason] = useState(role.noGoReason || '');

  function submit(e) {
    e.preventDefault();
    onSave({ status, noGoReason: status === 'No Go' ? noGoReason : null });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Role Status</h3>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            {ROLE_STATUSES.map(s => (
              <label key={s} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="accent-blue-600" />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s]}`}>{s}</span>
              </label>
            ))}
          </div>
          {status === 'No Go' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <select
                value={noGoReason}
                onChange={e => setNoGoReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select reason…</option>
                {NO_GO_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoleDetail() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const { data, addCandidate, updateRole, addFromTalentPool } = useData();
  const { openCandidate } = useUI();
  const [showAdd, setShowAdd] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const role = data.roles.find(r => r.id === roleId);
  if (!role) return <div className="p-6 text-gray-500">Role not found.</div>;

  const candidates = data.candidates.filter(c => c.roleId === roleId);
  const health = getRoleHealth(role);

  function groupByStage() {
    const groups = {};
    PIPELINE_STAGES.forEach(s => { groups[s] = []; });
    candidates.forEach(c => { if (groups[c.stage]) groups[c.stage].push(c); });
    return groups;
  }
  const groups = groupByStage();
  const stagesWithCandidates = PIPELINE_STAGES.filter(s => groups[s].length > 0);

  function handleAddCandidate(data_) {
    if (data_.fromPool) {
      addFromTalentPool(data_.entryId, roleId);
    } else {
      addCandidate({ ...data_, roleId });
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/roles')} className="text-sm text-gray-400 hover:text-gray-600 mb-2 transition-colors">
          ← All Roles
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <HealthDot health={health} />
              <h2 className="text-2xl font-bold text-gray-900">{role.jobTitle}</h2>
              <span className="text-gray-500 text-lg">·</span>
              <span className="text-gray-600 text-xl">{role.company}</span>
              <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[role.status] || 'bg-gray-100 text-gray-700'}`}>
                {role.status}
              </span>
              {role.noGoReason && (
                <span className="text-sm text-red-500">({role.noGoReason})</span>
              )}
            </div>
            {role.contactName && (
              <p className="text-sm text-gray-500 mt-1">Contact: {role.contactName}</p>
            )}
            <p className="text-sm text-gray-400 mt-1">
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} ·
              Last activity {daysSince(role.lastActivity) === 0 ? 'today' : `${daysSince(role.lastActivity)} days ago`}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowStatus(true)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Change Status
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Candidate
            </button>
          </div>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No candidates yet</p>
          <p className="text-sm">Click "+ Candidate" to add one</p>
        </div>
      ) : (
        <div className="space-y-6">
          {stagesWithCandidates.map(stage => (
            <div key={stage}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLORS[stage]}`}>
                  {stage}
                </span>
                <span className="text-xs text-gray-400">{groups[stage].length}</span>
              </div>
              <div className="space-y-1">
                {groups[stage].map(c => {
                  const inStage = daysSince(c.stageEnteredDate);
                  const overdue = isOverdue(c.followUpDate);
                  return (
                    <button
                      key={c.id}
                      onClick={() => openCandidate(c.id)}
                      className="w-full bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-4 hover:shadow-sm hover:border-blue-300 transition-all text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800">{c.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${FLAG_COLORS[c.flag] || 'bg-gray-100 text-gray-600'}`}>
                            {c.flag}
                          </span>
                        </div>
                        {c.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{c.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                        {c.followUpDate && (
                          <span className={overdue ? 'text-red-600 font-medium' : ''}>
                            {overdue ? `Overdue ${formatShortDate(c.followUpDate)}` : `Follow-up ${formatShortDate(c.followUpDate)}`}
                          </span>
                        )}
                        <span>{inStage}d in stage</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddCandidateModal
          roleId={roleId}
          onClose={() => setShowAdd(false)}
          onSave={handleAddCandidate}
          talentPool={data.talentPool}
        />
      )}
      {showStatus && (
        <StatusModal
          role={role}
          onClose={() => setShowStatus(false)}
          onSave={(updates) => updateRole(roleId, updates)}
        />
      )}
    </div>
  );
}
