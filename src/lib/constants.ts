export const ALLOWED_CALL_STATUSES = [
  'Not Called',
  'Recalled',
  'Treated',
  'Interested',
  'Accepted',
  'Client Configured',
  'Callback',
  'Busy',
  'No Answer',
  'Not Interested',
  'Wrong Number',
] as const;

export type CallStatus = typeof ALLOWED_CALL_STATUSES[number];

export const ALLOWED_DEAL_STAGES = [
  'New',
  'Contacted',
  'Interested',
  'Appointment Booked',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
] as const;

export type DealStage = typeof ALLOWED_DEAL_STAGES[number];
