/**
 * Indian State Codes (GST state codes - 37 entries as per GST portal)
 * Key: 2-digit state code string, Value: state name
 */
export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
}

/** Get state name from a GSTIN (first 2 digits) */
export function getStateFromGSTIN(gstin: string): string {
  const code = gstin.slice(0, 2)
  return INDIAN_STATE_CODES[code] ?? 'Unknown State'
}

/** Standard GST rates used across the system */
export const GST_RATES = [0, 5, 12, 18, 28] as const

/** Common document types for document numbering */
export const DOC_TYPES = {
  RFQ: 'RFQ',
  QUOTATION: 'QT',
  CUSTOMER_PO: 'CPO',
  SALES_ORDER: 'SO',
  PURCHASE_ORDER: 'PO',
  PURCHASE_REQUISITION: 'PR',
  DELIVERY_CHALLAN: 'DC',
  INVOICE: 'INV',
  ENGINEERING_RELEASE: 'ER',
  WORK_ORDER: 'JC',
  NCR: 'NCR',
  CAPA: 'CAPA',
  FAIR: 'FAIR',
  GRN: 'GRN',
  MAINTENANCE: 'PM',
} as const
