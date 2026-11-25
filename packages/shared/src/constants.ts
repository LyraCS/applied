// Declaration order is column order on the kanban board. Change it here and
// the board, filter dropdown and API validation all stay in sync.
export const STATUSES = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'] as const
export type Status = (typeof STATUSES)[number]

export const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'OTHER'] as const
export type JobType = (typeof JOB_TYPES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
  OTHER: 'Other',
}
