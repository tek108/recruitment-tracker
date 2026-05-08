export const PIPELINE_STAGES = [
  'Submitted',
  'On Hold',
  'Hiring Manager Interview',
  'Round 2',
  'Final Round',
  'Offer',
  'Offer Declined',
  'Placed',
  'Closed',
];

export const ACTIVE_STAGES = ['Submitted', 'On Hold', 'Hiring Manager Interview', 'Round 2', 'Final Round', 'Offer'];
export const TERMINAL_STAGES = ['Offer Declined', 'Placed', 'Closed'];

export const FOLLOW_UP_DAYS = {
  'Submitted': 3,
  'On Hold': 7,
  'Hiring Manager Interview': 2,
  'Round 2': 2,
  'Final Round': 2,
  'Offer': 1,
};

export const ROLE_STATUSES = ['Active', 'No Go', 'Filled', 'On Hold'];

export const NO_GO_REASONS = [
  'Role filled',
  'Budget cut',
  'Employer unresponsive',
  'Other',
];

export const CANDIDATE_FLAGS = ['Active', 'Hold', 'Maybe'];

export const REJECTION_REASONS = [
  'Employer passed',
  'Candidate withdrew',
  'Overqualified',
  'Salary mismatch',
  'Other',
];

export const STAGE_COLORS = {
  'Submitted':                 'bg-blue-100 text-blue-800',
  'On Hold':                   'bg-yellow-100 text-yellow-800',
  'Hiring Manager Interview':  'bg-purple-100 text-purple-800',
  'Round 2':                   'bg-indigo-100 text-indigo-800',
  'Final Round':               'bg-violet-100 text-violet-800',
  'Offer':                     'bg-green-100 text-green-800',
  'Offer Declined':            'bg-red-100 text-red-800',
  'Placed':                    'bg-emerald-100 text-emerald-800',
  'Closed':                    'bg-gray-100 text-gray-700',
};

export const FLAG_COLORS = {
  'Active': 'bg-green-100 text-green-800',
  'Hold':   'bg-yellow-100 text-yellow-800',
  'Maybe':  'bg-gray-100 text-gray-700',
};

export const STATUS_COLORS = {
  'Active':   'bg-green-100 text-green-800',
  'No Go':    'bg-red-100 text-red-800',
  'Filled':   'bg-gray-100 text-gray-700',
  'On Hold':  'bg-yellow-100 text-yellow-800',
};

export const AWAITING_FEEDBACK_DAYS = 5;
export const STALLED_DAYS = 7;
