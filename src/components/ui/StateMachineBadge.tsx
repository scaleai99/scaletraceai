import { Badge, BadgeVariant } from './Badge'

interface StateConfig {
  label: string
  variant: BadgeVariant
}

/**
 * Maps ERP state strings to Zoho-style colour scheme:
 * Grey  -> Draft / initial states
 * Blue  -> Open / sent / active / approved / submitted
 * Orange -> In Progress / awaiting / partially received/dispatched/paid / scheduled
 * Green -> Completed / paid / won / closed / fully received
 * Red   -> Cancelled / overdue / rejected / loss / suspended / delisted
 */
const STATE_MAP: Record<string, StateConfig> = {
  // --- Grey - draft / initial -----------------------------------------------
  Draft:             { label: 'Draft',             variant: 'default' },
  Pending:           { label: 'Pending',           variant: 'default' },
  'Pending Approval':{ label: 'Pending Approval',  variant: 'default' },
  Unscheduled:       { label: 'Unscheduled',       variant: 'default' },
  Planned:           { label: 'Planned',           variant: 'default' },
  Inactive:          { label: 'Inactive',          variant: 'default' },
  // --- Blue - open / active / sent ------------------------------------------
  Open:              { label: 'Open',              variant: 'info' },
  Sent:              { label: 'Sent',              variant: 'info' },
  Active:            { label: 'Active',            variant: 'info' },
  Received:          { label: 'Received',          variant: 'info' },
  Released:          { label: 'Released',          variant: 'info' },
  Submitted:         { label: 'Submitted',         variant: 'info' },
  Approved:          { label: 'Approved',          variant: 'info' },
  'Revision Requested':{ label: 'Revision Requested', variant: 'info' },
  // --- Orange - in progress / partial ---------------------------------------
  'In Progress':        { label: 'In Progress',        variant: 'warning' },
  'Awaiting Approval':  { label: 'Awaiting Approval',  variant: 'warning' },
  'Partially Received': { label: 'Partially Received', variant: 'warning' },
  'Partially Dispatched':{ label: 'Partially Dispatched', variant: 'warning' },
  'Partially Paid':     { label: 'Partially Paid',     variant: 'warning' },
  Scheduled:            { label: 'Scheduled',          variant: 'warning' },
  'On Hold':            { label: 'On Hold',            variant: 'warning' },
  'In Review':          { label: 'In Review',          variant: 'warning' },
  // --- Green - completed / done ---------------------------------------------
  Completed:         { label: 'Completed',         variant: 'success' },
  Paid:              { label: 'Paid',              variant: 'success' },
  Won:               { label: 'Won',               variant: 'success' },
  Closed:            { label: 'Closed',            variant: 'success' },
  'Fully Received':  { label: 'Fully Received',    variant: 'success' },
  Accepted:          { label: 'Accepted',          variant: 'success' },
  Qualified:         { label: 'Qualified',         variant: 'success' },
  // --- Red - cancelled / rejected / failed ----------------------------------
  Cancelled:         { label: 'Cancelled',         variant: 'danger' },
  Overdue:           { label: 'Overdue',           variant: 'danger' },
  Rejected:          { label: 'Rejected',          variant: 'danger' },
  Loss:              { label: 'Loss',              variant: 'danger' },
  Suspended:         { label: 'Suspended',         variant: 'danger' },
  Delisted:          { label: 'Delisted',          variant: 'danger' },
  Expired:           { label: 'Expired',           variant: 'danger' },
  Scrapped:          { label: 'Scrapped',          variant: 'danger' },
  Failed:            { label: 'Failed',            variant: 'danger' },
  'Not Feasible':    { label: 'Not Feasible',      variant: 'danger' },
}

interface StateMachineBadgeProps {
  state: string
  size?: 'sm' | 'md'
}

export function StateMachineBadge({ state, size = 'md' }: StateMachineBadgeProps) {
  const config = STATE_MAP[state] ?? { label: state, variant: 'default' as BadgeVariant }
  return <Badge variant={config.variant} size={size}>{config.label}</Badge>
}
