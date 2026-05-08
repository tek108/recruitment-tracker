import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../App';
import { useNavigate } from 'react-router-dom';
import { STAGE_COLORS, STATUS_COLORS } from '../utils/constants';

export default function Search() {
  const { data } = useData();
  const { openCandidate } = useUI();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  function search() {
    if (!q) return { roles: [], candidates: [] };

    const matchedRoles = data.roles.filter(r =>
      r.jobTitle.toLowerCase().includes(q) ||
      r.company.toLowerCase().includes(q) ||
      (r.contactName || '').toLowerCase().includes(q)
    );

    const matchedCandidates = data.candidates.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.notes || '').toLowerCase().includes(q) ||
      (c.employerFeedback || '').toLowerCase().includes(q)
    );

    return { roles: matchedRoles, candidates: matchedCandidates };
  }

  const { roles: matchedRoles, candidates: matchedCandidates } = search();
  const total = matchedRoles.length + matchedCandidates.length;

  function highlight(text, q) {
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-gray-900 rounded">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Search</h2>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search candidates, roles, companies, notes…"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        {q && (
          <p className="text-sm text-gray-500 mt-2">
            {total} result{total !== 1 ? 's' : ''} for "{q}"
          </p>
        )}
      </div>

      {q && total === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No results found</p>
        </div>
      )}

      {matchedRoles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Roles ({matchedRoles.length})</h3>
          <div className="space-y-2">
            {matchedRoles.map(role => (
              <button
                key={role.id}
                onClick={() => navigate(`/roles/${role.id}`)}
                className="w-full bg-white rounded-xl border border-gray-200 px-5 py-4 text-left hover:shadow-sm hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{highlight(role.jobTitle, q)}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{highlight(role.company, q)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[role.status] || 'bg-gray-100 text-gray-700'}`}>
                    {role.status}
                  </span>
                </div>
                {role.contactName && (
                  <p className="text-sm text-gray-500 mt-0.5">{highlight(role.contactName, q)}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {matchedCandidates.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Candidates ({matchedCandidates.length})</h3>
          <div className="space-y-2">
            {matchedCandidates.map(c => {
              const role = data.roles.find(r => r.id === c.roleId);
              return (
                <button
                  key={c.id}
                  onClick={() => openCandidate(c.id)}
                  className="w-full bg-white rounded-xl border border-gray-200 px-5 py-4 text-left hover:shadow-sm hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{highlight(c.name, q)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[c.stage] || 'bg-gray-100 text-gray-700'}`}>
                      {c.stage}
                    </span>
                  </div>
                  {role && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {role.jobTitle} · {role.company}
                    </p>
                  )}
                  {c.notes && q && c.notes.toLowerCase().includes(q) && (
                    <p className="text-xs text-gray-400 mt-1 italic">{highlight(c.notes, q)}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
