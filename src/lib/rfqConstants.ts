/**
 * RFQ state machine constants - mirrors the backend model definition.
 * Used across RFQListPage, RFQDetailPage for filters and steppers.
 */

export const RFQ_STATES: string[] = [
  'Received',
  'Registration',
  'Document Upload',
  'AI Drawing Reader',
  'AI Surface Treatment Analysis',
  'Configuration Review-1',
  'Contract Review-1',
  'Feasibility Review',
  'AI Costing',
  'Cost Review',
  'Quotation Approval',
  'Quotation Release',
  'Customer Submission',
  'Won',
  'Loss',
  'PO Received',
]

/** Permitted next states for each current state. */
export const RFQ_TRANSITIONS: Record<string, string[]> = {
  Received: ['Registration'],
  Registration: ['Document Upload'],
  'Document Upload': ['AI Drawing Reader'],
  'AI Drawing Reader': ['AI Surface Treatment Analysis'],
  'AI Surface Treatment Analysis': ['Configuration Review-1'],
  'Configuration Review-1': ['Contract Review-1'],
  'Contract Review-1': ['Feasibility Review', 'Loss'],
  'Feasibility Review': ['AI Costing', 'Loss'],
  'AI Costing': ['Cost Review'],
  'Cost Review': ['Quotation Approval'],
  'Quotation Approval': ['Quotation Release'],
  'Quotation Release': ['Customer Submission'],
  'Customer Submission': ['Won', 'Loss', 'PO Received'],
  Won: [],
  Loss: [],
  'PO Received': [],
}

/** Terminal states that no longer accept further transitions. */
export const RFQ_TERMINAL_STATES = new Set(['Won', 'Loss', 'PO Received'])

/** States where forward progress in the linear flow is shown. */
export const RFQ_LINEAR_STATES = RFQ_STATES.slice(0, 13) // Received -> Customer Submission
