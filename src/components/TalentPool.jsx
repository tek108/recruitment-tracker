import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatShortDate } from '../utils/dateUtils';

function AddToRoleModal({ entry, roles, onClose, onAdd }) {
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const activeRoles = roles.filter(r => r.status === 'Active' && r.id !== entry.savedFromRoleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Add to Role</h3>
        <p className="text-sm text-gray-500 mb-4">Adding <strong>{entry.candidateName}</strong> as Submitted</p>
        {activeRoles.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">No other active roles available</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {activeRoles.map(r => (
              <label key={r.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="roleId"
                  value={r.id}
                  checked={selectedRoleId === r.id}
                  onChange={() => setSelectedRoleId(r.id)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-800">{r.jobTitle} · {r.company}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (selectedRoleId) { onAdd(entry.id, selectedRoleId); onClose(); } }}
            disabled={!selectedRoleId}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Role
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TalentPool() {
  const { data, removeFromTalentPool, addFromTalentPool } = useData();
  const [addingEntry, setAddingEntry] = useState(null);

  const sorted = [...data.talentPool].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Talent Pool</h2>
        <p className="text-gray-500 text-sm mt-1">
          {data.talentPool.length} saved candidate{data.talentPool.length !== 1 ? 's' : ''}
        </p>
      </div>

      {data.talentPool.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Talent pool is empty</p>
          <p className="text-sm">
            When closing or rejecting candidates, click "Save to Talent Pool" in the candidate card.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(entry => (
            <div
              key={entry.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{entry.candidateName}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Was at <span className="font-medium">{entry.stage}</span> · {entry.savedFromRole}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-gray-600 mt-1 italic">{entry.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Saved {formatShortDate(entry.savedAt)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setAddingEntry(entry)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add to Role
                  </button>
                  <button
                    onClick={() => removeFromTalentPool(entry.id)}
                    className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {addingEntry && (
        <AddToRoleModal
          entry={addingEntry}
          roles={data.roles}
          onClose={() => setAddingEntry(null)}
          onAdd={addFromTalentPool}
        />
      )}
    </div>
  );
}
