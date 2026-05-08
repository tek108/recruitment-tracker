import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { formatShortDate, isOverdue, getWeekStart } from '../utils/dateUtils';
import { PIPELINE_STAGES, TERMINAL_STAGES } from '../utils/constants';

function generateSummary(data) {
  const weekStart = getWeekStart();
  const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const lines = [`Week of ${weekLabel}`, '---'];

  const activeRoles = data.roles.filter(r => r.status !== 'No Go' && r.status !== 'Filled');

  if (activeRoles.length === 0) {
    lines.push('No active roles.');
    return lines.join('\n');
  }

  activeRoles.forEach(role => {
    const candidates = data.candidates.filter(c => c.roleId === role.id);
    if (candidates.length === 0) return;

    lines.push('');
    lines.push(`${role.jobTitle} — ${role.company} [${role.status}]`);

    // Group by stage (only non-terminal active stages)
    const activeStages = PIPELINE_STAGES.filter(s => !TERMINAL_STAGES.includes(s));
    activeStages.forEach(stage => {
      const inStage = candidates.filter(c => c.stage === stage);
      if (inStage.length > 0) {
        lines.push(`  ${stage}: ${inStage.map(c => c.name).join(', ')}`);
      }
    });

    // Terminal stages
    TERMINAL_STAGES.forEach(stage => {
      const inStage = candidates.filter(c => c.stage === stage);
      if (inStage.length > 0) {
        lines.push(`  ${stage}: ${inStage.map(c => c.name).join(', ')}`);
      }
    });

    // Follow-ups due
    const followUps = candidates.filter(c => c.followUpDate);
    if (followUps.length > 0) {
      const dueParts = followUps.map(c => {
        const overdue = isOverdue(c.followUpDate);
        const stageNote = c.stage !== 'Submitted' ? `, ${c.stage.toLowerCase()}` : '';
        return `${c.name} (${overdue ? 'OVERDUE' : 'due'} ${formatShortDate(c.followUpDate)}${stageNote})`;
      });
      lines.push(`  Follow-ups: ${dueParts.join('; ')}`);
    }
  });

  return lines.join('\n');
}

export default function WeeklySummary({ onClose }) {
  const { data } = useData();
  const [copied, setCopied] = useState(false);

  const summary = generateSummary(data);

  function copy() {
    navigator.clipboard.writeText(summary).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">Weekly Summary</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-200 leading-relaxed">
            {summary}
          </pre>
        </div>
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button
            onClick={copy}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
