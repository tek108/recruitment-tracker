import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useUI } from '../App';
import { isOverdue, daysAgo, daysSince, formatShortDate } from '../utils/dateUtils';
import { AWAITING_FEEDBACK_DAYS, STALLED_DAYS, STAGE_COLORS } from '../utils/constants';

function StageBadge({ stage }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage] || 'bg-gray-100 text-gray-700'}`}>
      {stage}
    </span>
  );
}

function Section({ title, count, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const dotColors = { red: 'bg-red-500', yellow: 'bg-yellow-400', blue: 'bg-blue-500', gray: 'bg-gray-400' };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColors[color]}`} />
          <span className="font-semibold text-gray-800">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            count > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {count}
          </span>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {count === 0
            ? <p className="px-5 py-4 text-sm text-gray-400 italic">None — all clear!</p>
            : children
          }
        </div>
      )}
    </div>
  );
}

function CandidateRow({ candidate, role, onClick, urgencyLabel }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-4 px-5 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800 text-sm">{candidate.name}</span>
          <StageBadge stage={candidate.stage} />
          {urgencyLabel && (
            <span className="text-xs text-red-600 font-medium">{urgencyLabel}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {role?.jobTitle} · {role?.company}
        </p>
      </div>
      {candidate.followUpDate && (
        <div className="text-right flex-shrink-0">
          <p className={`text-xs font-medium ${isOverdue(candidate.followUpDate) ? 'text-red-600' : 'text-gray-500'}`}>
            {isOverdue(candidate.followUpDate) ? `${daysAgo(candidate.followUpDate)}d overdue` : `Due ${formatShortDate(candidate.followUpDate)}`}
          </p>
        </div>
      )}
    </button>
  );
}

export default function DailyDigest() {
  const { data } = useData();
  const { openCandidate } = useUI();
  const navigate = useNavigate();

  const today = new Date();

  // Overdue follow-ups
  const overdueFollowUps = data.candidates.filter(c => isOverdue(c.followUpDate));

  // Awaiting employer feedback: in submitted/interview stage for 5+ days with no recent activity
  const awaitingFeedback = data.candidates.filter(c => {
    const activeInterviewStages = ['Submitted', 'Hiring Manager Interview', 'Round 2', 'Final Round'];
    if (!activeInterviewStages.includes(c.stage)) return false;
    const daysSinceEntered = daysSince(c.stageEnteredDate);
    if (daysSinceEntered < AWAITING_FEEDBACK_DAYS) return false;
    const lastLog = c.activityLog[c.activityLog.length - 1];
    const daysSinceLastActivity = lastLog ? daysSince(lastLog.timestamp) : daysSinceEntered;
    return daysSinceLastActivity >= AWAITING_FEEDBACK_DAYS;
  });

  // Stalled roles: active roles with no activity in 7+ days
  const stalledRoles = data.roles.filter(r => {
    if (r.status !== 'Active') return false;
    return daysSince(r.lastActivity) >= STALLED_DAYS;
  });

  // Action needed today: deduplicated union of overdue + awaiting feedback
  const actionSet = new Map();
  overdueFollowUps.forEach(c => actionSet.set(c.id, { candidate: c, source: 'overdue' }));
  awaitingFeedback.forEach(c => {
    if (!actionSet.has(c.id)) actionSet.set(c.id, { candidate: c, source: 'feedback' });
  });
  const actionItems = Array.from(actionSet.values()).sort((a, b) => {
    if (a.source === 'overdue' && b.source !== 'overdue') return -1;
    if (b.source === 'overdue' && a.source !== 'overdue') return 1;
    const aOverdue = a.candidate.followUpDate ? daysAgo(a.candidate.followUpDate) : 0;
    const bOverdue = b.candidate.followUpDate ? daysAgo(b.candidate.followUpDate) : 0;
    return bOverdue - aOverdue;
  });

  const getRole = (roleId) => data.roles.find(r => r.id === roleId);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Daily Digest</h2>
        <p className="text-gray-500 text-sm mt-1">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="space-y-4">
        {/* Action needed today */}
        <Section title="Action Needed Today" count={actionItems.length} color="red">
          {actionItems.map(({ candidate, source }) => (
            <CandidateRow
              key={candidate.id}
              candidate={candidate}
              role={getRole(candidate.roleId)}
              onClick={() => openCandidate(candidate.id)}
              urgencyLabel={source === 'overdue' ? 'Follow-up overdue' : 'Awaiting feedback'}
            />
          ))}
        </Section>

        {/* Overdue follow-ups */}
        <Section title="Overdue Follow-ups" count={overdueFollowUps.length} color="red">
          {overdueFollowUps
            .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
            .map(c => (
              <CandidateRow
                key={c.id}
                candidate={c}
                role={getRole(c.roleId)}
                onClick={() => openCandidate(c.id)}
              />
            ))
          }
        </Section>

        {/* Awaiting employer feedback */}
        <Section title="Awaiting Employer Feedback" count={awaitingFeedback.length} color="yellow">
          {awaitingFeedback.map(c => (
            <CandidateRow
              key={c.id}
              candidate={c}
              role={getRole(c.roleId)}
              onClick={() => openCandidate(c.id)}
              urgencyLabel={`${daysSince(c.stageEnteredDate)}d in stage`}
            />
          ))}
        </Section>

        {/* Stalled roles */}
        <Section title="Stalled Roles" count={stalledRoles.length} color="yellow">
          {stalledRoles.map(role => {
            const activeCandidates = data.candidates.filter(
              c => c.roleId === role.id && !['Placed', 'Closed', 'Offer Declined'].includes(c.stage)
            ).length;
            return (
              <button
                key={role.id}
                onClick={() => navigate(`/roles/${role.id}`)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">{role.jobTitle}</p>
                  <p className="text-xs text-gray-500">{role.company} · {activeCandidates} active candidate{activeCandidates !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-xs text-yellow-600 font-medium">
                  {daysSince(role.lastActivity)}d no activity
                </span>
              </button>
            );
          })}
        </Section>
      </div>
    </div>
  );
}
