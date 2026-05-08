import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  formatShortDate, formatDateTime, isOverdue, suggestFollowUpDate, daysSince,
} from '../utils/dateUtils';
import {
  PIPELINE_STAGES, TERMINAL_STAGES, STAGE_COLORS, FLAG_COLORS,
  CANDIDATE_FLAGS, REJECTION_REASONS,
} from '../utils/constants';

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function CandidateCard({ candidateId, onClose }) {
  const { data, updateCandidate, deleteCandidate, addToTalentPool } = useData();

  const candidate = data.candidates.find(c => c.id === candidateId);
  const role = candidate ? data.roles.find(r => r.id === candidate.roleId) : null;

  // Local edit state
  const [name, setName] = useState('');
  const [flag, setFlag] = useState('Active');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [employerFeedback, setEmployerFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Stage advance UI state
  const [pendingStage, setPendingStage] = useState(null);
  const [pendingFollowUp, setPendingFollowUp] = useState('');
  const [pendingRejection, setPendingRejection] = useState('');

  // Generated message
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [msgCopied, setMsgCopied] = useState(false);

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync local state when candidate changes
  useEffect(() => {
    if (!candidate) return;
    setName(candidate.name);
    setFlag(candidate.flag);
    setFollowUpDate(candidate.followUpDate || '');
    setNotes(candidate.notes || '');
    setEmployerFeedback(candidate.employerFeedback || '');
    setRejectionReason(candidate.rejectionReason || '');
    setPendingStage(null);
    setGeneratedMsg('');
    setMsgCopied(false);
  }, [candidateId]);

  if (!candidate || !role) return null;

  const stageIdx = PIPELINE_STAGES.indexOf(candidate.stage);
  const prevStage = stageIdx > 0 ? PIPELINE_STAGES[stageIdx - 1] : null;
  const nextStage = stageIdx < PIPELINE_STAGES.length - 1 ? PIPELINE_STAGES[stageIdx + 1] : null;

  function save() {
    const updates = {};
    if (name !== candidate.name) updates.name = name;
    if (flag !== candidate.flag) updates.flag = flag;
    if ((followUpDate || null) !== candidate.followUpDate) updates.followUpDate = followUpDate || null;
    if (notes !== candidate.notes) updates.notes = notes;
    if (employerFeedback !== candidate.employerFeedback) updates.employerFeedback = employerFeedback;
    if (rejectionReason !== candidate.rejectionReason) updates.rejectionReason = rejectionReason;
    if (Object.keys(updates).length > 0) {
      updateCandidate(candidateId, updates);
    }
  }

  function saveAndClose() {
    save();
    onClose();
  }

  function initiateStageChange(targetStage) {
    const suggested = suggestFollowUpDate(targetStage) || '';
    setPendingStage(targetStage);
    setPendingFollowUp(suggested);
    setPendingRejection('');
  }

  function confirmStageChange() {
    if (!pendingStage) return;
    // Save any pending edits first
    save();
    const updates = {
      stage: pendingStage,
      followUpDate: pendingFollowUp || null,
      ...(pendingRejection ? { rejectionReason: pendingRejection } : {}),
    };
    updateCandidate(candidateId, updates);
    setPendingStage(null);
    setPendingFollowUp('');
    setPendingRejection('');
  }

  function generateMessage() {
    const contactName = role.contactName || '[Contact Name]';
    const stageLine = `They are currently at the ${candidate.stage} stage.`;
    const noteLine = notes.trim() ? ` ${notes.trim()}` : '';
    const msg = `Hi ${contactName},\n\nI wanted to follow up on ${name} for the ${role.jobTitle} position at ${role.company}. ${stageLine}${noteLine}\n\nLet me know if you need anything from my end.`;
    setGeneratedMsg(msg);
    setMsgCopied(false);
  }

  function copyMsg() {
    copyToClipboard(generatedMsg);
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 2000);
  }

  const isTerminal = TERMINAL_STAGES.includes(candidate.stage);
  const pendingIsTerminal = pendingStage && TERMINAL_STAGES.includes(pendingStage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-xl font-bold text-gray-900 w-full focus:outline-none border-b border-transparent focus:border-blue-400 pb-0.5 bg-transparent"
              placeholder="Candidate name"
            />
            <p className="text-sm text-gray-500 mt-0.5">{role.jobTitle} · {role.company}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Flag selector */}
            <div className="flex gap-1">
              {CANDIDATE_FLAGS.map(f => (
                <button
                  key={f}
                  onClick={() => setFlag(f)}
                  className={`text-xs px-2 py-1 rounded-full font-medium border transition-all ${
                    flag === f
                      ? `${FLAG_COLORS[f]} border-transparent ring-2 ring-offset-1 ring-blue-400`
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stage bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => prevStage && initiateStageChange(prevStage)}
              disabled={!prevStage}
              className="px-3 py-1.5 text-sm border rounded-lg font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-gray-300 text-gray-700 hover:enabled:bg-gray-100"
            >
              ← Prev
            </button>

            <div className="flex-1 flex items-center justify-center gap-2">
              <span className={`text-sm px-3 py-1 rounded-full font-semibold ${STAGE_COLORS[candidate.stage] || 'bg-gray-100 text-gray-700'}`}>
                {candidate.stage}
              </span>
              <span className="text-xs text-gray-400">{daysSince(candidate.stageEnteredDate)}d in stage</span>
            </div>

            <button
              onClick={() => nextStage && initiateStageChange(nextStage)}
              disabled={!nextStage}
              className="px-3 py-1.5 text-sm border rounded-lg font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-gray-300 text-gray-700 hover:enabled:bg-gray-100"
            >
              Next →
            </button>
          </div>

          {/* Stage change confirmation */}
          {pendingStage && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Move to <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STAGE_COLORS[pendingStage]}`}>{pendingStage}</span>?
              </p>
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="block text-xs text-blue-700 mb-1">Follow-up date</label>
                  <input
                    type="date"
                    value={pendingFollowUp}
                    onChange={e => setPendingFollowUp(e.target.value)}
                    className="border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {pendingIsTerminal && (
                  <div>
                    <label className="block text-xs text-blue-700 mb-1">Reason</label>
                    <select
                      value={pendingRejection}
                      onChange={e => setPendingRejection(e.target.value)}
                      className="border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select reason…</option>
                      {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingStage(null)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStageChange}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Confirm
                  </button>
                </div>
              </div>
              {pendingIsTerminal && (
                <p className="text-xs text-blue-600 mt-2">
                  Tip: After saving, you can add this candidate to the Talent Pool.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Details */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 border-r border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Follow-up Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isOverdue(followUpDate) ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300'
                  }`}
                />
                {isOverdue(followUpDate) && (
                  <span className="text-xs text-red-600 font-medium">Overdue</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes…"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Employer Feedback
              </label>
              <textarea
                rows={2}
                value={employerFeedback}
                onChange={e => setEmployerFeedback(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What the employer said about this candidate…"
              />
            </div>

            {(isTerminal || rejectionReason) && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Rejection / Close Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason…</option>
                  {REJECTION_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* Generate message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Follow-up Message
                </label>
                <button
                  onClick={generateMessage}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Generate
                </button>
              </div>
              {generatedMsg && (
                <div className="relative">
                  <textarea
                    readOnly
                    rows={6}
                    value={generatedMsg}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700"
                  />
                  <button
                    onClick={copyMsg}
                    className={`absolute top-2 right-2 text-xs px-2 py-1 rounded font-medium transition-colors ${
                      msgCopied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {msgCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Activity log */}
          <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity Log</h4>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {[...candidate.activityLog].reverse().map((entry, i) => (
                <div key={i} className="text-xs">
                  <p className="text-gray-400">{formatDateTime(entry.timestamp)}</p>
                  <p className="text-gray-700 mt-0.5">{entry.entry}</p>
                </div>
              ))}
              {candidate.activityLog.length === 0 && (
                <p className="text-xs text-gray-400 italic">No activity yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50">
          <div className="flex gap-2">
            {(isTerminal) && (
              <button
                onClick={() => addToTalentPool(candidateId)}
                className="px-3 py-1.5 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors font-medium"
              >
                ⭐ Save to Talent Pool
              </button>
            )}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Delete candidate?</span>
                <button
                  onClick={() => { deleteCandidate(candidateId); onClose(); }}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={saveAndClose}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
