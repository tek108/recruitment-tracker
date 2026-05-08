import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../App';
import { daysSince } from '../utils/dateUtils';
import { PIPELINE_STAGES, STATUS_COLORS, STAGE_COLORS } from '../utils/constants';

// Short stage labels for the pipeline bar
const STAGE_SHORT = {
  'Submitted':                'Submitted',
  'On Hold':                  'On Hold',
  'Hiring Manager Interview': 'HM Interview',
  'Round 2':                  'Round 2',
  'Final Round':              'Final Round',
  'Offer':                    'Offer',
  'Offer Declined':           'Declined',
  'Placed':                   'Placed',
  'Closed':                   'Closed',
};

function HealthDot({ health }) {
  const cfg = {
    green:  { dot: 'bg-green-500',  ring: 'ring-green-200',  label: 'On track' },
    yellow: { dot: 'bg-yellow-400', ring: 'ring-yellow-200', label: 'Needs attention' },
    red:    { dot: 'bg-red-500',    ring: 'ring-red-200',    label: 'No go / Filled' },
  };
  const c = cfg[health] || { dot: 'bg-gray-300', ring: 'ring-gray-200', label: '' };
  return (
    <span
      title={c.label}
      className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ring-2 ${c.dot} ${c.ring}`}
    />
  );
}

function getRoleHealth(role) {
  if (role.status === 'No Go' || role.status === 'Filled') return 'red';
  return daysSince(role.lastActivity) >= 7 ? 'yellow' : 'green';
}

function ActivityAge({ days }) {
  if (days === 0) return <span className="text-xs font-medium text-green-600">Today</span>;
  if (days <= 2) return <span className="text-xs text-green-600">{days}d ago</span>;
  if (days < 7)  return <span className="text-xs text-gray-500">{days}d ago</span>;
  if (days < 14) return <span className="text-xs font-medium text-yellow-600">{days}d ago</span>;
  return <span className="text-xs text-gray-400">{days}d ago</span>;
}

function PipelineBar({ stageCounts }) {
  const entries = PIPELINE_STAGES
    .map(s => ({ stage: s, count: stageCounts[s] || 0 }))
    .filter(e => e.count > 0);

  if (entries.length === 0) {
    return <span className="text-xs text-gray-400 italic">No candidates</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {entries.map(({ stage, count }, i) => (
        <React.Fragment key={stage}>
          {i > 0 && (
            <span className="text-gray-300 text-xs select-none leading-none">›</span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage] || 'bg-gray-100 text-gray-600'}`}>
            <span className="font-bold tabular-nums">{count}</span>
            <span className="opacity-90">{STAGE_SHORT[stage]}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function AddRoleModal({ onClose, onSave }) {
  const [form, setForm] = useState({ jobTitle: '', company: '', contactName: '', status: 'Active' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function submit(e) {
    e.preventDefault();
    if (!form.jobTitle.trim() || !form.company.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Role</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
            <input
              autoFocus required
              value={form.jobTitle}
              onChange={e => set('jobTitle', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Senior Software Engineer"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
            <input
              required
              value={form.company}
              onChange={e => set('company', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Employer Contact Name</label>
            <input
              value={form.contactName}
              onChange={e => set('contactName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hiring manager name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['Active', 'On Hold', 'No Go', 'Filled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Add Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoleDashboard() {
  const { data, addRole } = useData();
  const { openWeeklySummary } = useUI();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  function getStageCounts(roleId) {
    const counts = {};
    data.candidates
      .filter(c => c.roleId === roleId)
      .forEach(c => { counts[c.stage] = (counts[c.stage] || 0) + 1; });
    return counts;
  }

  const sorted = [...data.roles].sort((a, b) => {
    const order = { Active: 0, 'On Hold': 1, Filled: 2, 'No Go': 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Roles</h2>
          <p className="text-gray-500 text-sm mt-0.5">{data.roles.length} role{data.roles.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openWeeklySummary}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Weekly Summary
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Role
          </button>
        </div>
      </div>

      {data.roles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No roles yet</p>
          <p className="text-sm">Click "+ Add Role" to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(role => {
            const health = getRoleHealth(role);
            const stageCounts = getStageCounts(role.id);
            const totalCandidates = data.candidates.filter(c => c.roleId === role.id).length;
            const days = daysSince(role.lastActivity);

            // Left border color by health
            const borderAccent = health === 'green' ? 'border-l-green-400'
              : health === 'yellow' ? 'border-l-yellow-400'
              : 'border-l-red-400';

            return (
              <div
                key={role.id}
                onClick={() => navigate(`/roles/${role.id}`)}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderAccent} shadow-sm px-5 py-3.5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group`}
              >
                {/* Top row: identity + meta */}
                <div className="flex items-center gap-3 mb-2">
                  <HealthDot health={health} />

                  {/* Title + company */}
                  <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-[15px] leading-snug group-hover:text-blue-700 transition-colors">
                      {role.jobTitle}
                    </span>
                    <span className="text-gray-400 text-sm">·</span>
                    <span className="text-gray-500 text-sm">{role.company}</span>
                  </div>

                  {/* Right-aligned meta */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[role.status] || 'bg-gray-100 text-gray-700'}`}>
                      {role.status}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums">
                      {totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''}
                    </span>
                    <ActivityAge days={days} />
                  </div>
                </div>

                {/* Pipeline bar */}
                <div className="pl-6">
                  <PipelineBar stageCounts={stageCounts} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddRoleModal onClose={() => setShowAdd(false)} onSave={addRole} />
      )}
    </div>
  );
}
