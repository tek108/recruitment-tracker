import { FOLLOW_UP_DAYS } from './constants';

export function addDaysToDate(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toISODateString(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function daysDiff(fromStr, toStr) {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  return Math.floor((to - from) / (1000 * 60 * 60 * 24));
}

export function daysAgo(dateStr) {
  return daysDiff(dateStr, new Date());
}

export function daysSince(dateStr) {
  return daysAgo(dateStr);
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function suggestFollowUpDate(stage) {
  const days = FOLLOW_UP_DAYS[stage];
  if (!days) return null;
  return toISODateString(addDaysToDate(new Date(), days));
}

export function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}
