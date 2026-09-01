export type TabId = 'overview' | 'itemCodes' | 'drawings' | 'dimensions';

export type ItemCategory = 'Finished' | 'Semi-Finished' | 'Raw Material' | 'Consumable' | 'Free-Issue';
export type SalesCategory = 'Aerospace' | 'Defence' | 'Automotive' | 'Locomotive';
export type SurfaceTreatment =
  | 'Chemical Conversion Coating'
  | 'Anodizing'
  | 'Cadmium Plating'
  | 'Zinc Nickel'
  | 'Passivation'
  | 'Painting'
  | 'None';
export type HeatTreatment = 'Solution Treat + Age' | 'Stress Relief' | 'Annealed' | 'None';
export type SpecialProcess = 'NDT' | 'Penetrant Inspection' | 'Magnetic Particle' | 'None';

export interface OverviewData {
  partNo: string;
  customerPartNo: string;
  drawingNo: string;
  revision: string;
  partName: string;
  description: string;
  itemShortDesc: string;
  itemLongDesc: string;
  length: string;
  width: string;
  thickness: string;
  itemCategory: ItemCategory | '';
  salesCategory: SalesCategory | '';
  unitOfMeasure: string;
  hsnCode: string;
  minimumOrderQty: number;
  customer: string;
  drawingStandard: string;
  materialSpec: string;
  surfaceTreatment: SurfaceTreatment | '';
  heatTreatment: HeatTreatment | '';
  specialProcess: SpecialProcess | '';
  status: 'Active' | 'Inactive';
  remarks: string;
}

export interface AlternateCode {
  id: string;
  codeType: string;
  codeValue: string;
  issuedBy: string;
  remarks: string;
}

export interface ItemCodeData {
  itemCode: string;
  prefix: string;
  suffix: string;
  customerItemCode: string;
  alternateCodes: AlternateCode[];
}

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  revision: string;
  date: string;
  uploadedBy: string;
}

export interface DrawingsData {
  drawingNumber: string;
  revisionLevel: string;
  drawingDate: string;
  drawingStandard: string;
  drawnBy: string;
  stepFileName: string;
  documents: DocumentRecord[];
}

export interface DimensionsData {
  lengthMm: string;
  widthMm: string;
  thicknessMm: string;
  diameterMm: string;
  weightG: string;
  surfaceAreaMm2: string;
  volumeMm3: string;
  rawMaterialForm: string;
  alloyGrade: string;
  materialSpecNo: string;
  hardness: string;
  densityGcm3: string;
  tensileStrengthMpa: string;
}

export interface ItemMasterForm {
  overview: OverviewData;
  itemCodes: ItemCodeData;
  drawings: DrawingsData;
  dimensions: DimensionsData;
}

// AI extraction types
export interface ExtractionField {
  value: string | number | null;
  confidence: number;
}

export interface DrawingExtractionResult {
  drawing_number: ExtractionField;
  part_number: ExtractionField;
  revision: ExtractionField;
  part_name: ExtractionField;
  material: ExtractionField;
  tolerance: ExtractionField;
  key_characteristics: ExtractionField;
  issued_by: ExtractionField;
  approved_by: ExtractionField;
  material_spec: ExtractionField;
  length_mm: ExtractionField;
  width_mm: ExtractionField;
  thickness_mm: ExtractionField;
  diameter_mm: ExtractionField;
  radius_mm: ExtractionField;
  weight_g: ExtractionField;
  surface_area_mm2: ExtractionField;
  volume_mm3: ExtractionField;
  surface_treatment: ExtractionField;
  heat_treatment: ExtractionField;
  special_process: ExtractionField;
  drawing_date: ExtractionField;
  drawn_by: ExtractionField;
  customer_name: ExtractionField;
  alloy_grade: ExtractionField;
  material_spec_no: ExtractionField;
  hardness: ExtractionField;
  raw_text: string;
  extraction_id: string;
  model_used: string;
  extracted_at: string;
  agent_suggestion?: AgentSuggestion;
}

export interface RfqLineDraft {
  line_number: number;
  part_description: string;
  drawing_number: string;
  drawing_revision: string;
  material_spec: string;
  special_processes: string[];
  surface_treatment_spec: string;
  fai_required: boolean;
  coc_required: boolean;
  annual_quantity: number;
  batch_quantity: number;
  delivery_schedule?: string;
}

export interface RfqDraft {
  received_date: string;
  quotation_due_date: string;
  priority: string;
  status: string;
  _note: string;
}

export interface AgentSuggestion {
  should_suggest: boolean;
  confidence: number;
  confidence_label: 'high' | 'medium' | 'low';
  reason: string;
  rfq_draft: RfqDraft | null;
  line_item_draft: RfqLineDraft | null;
}

export interface AiStatusResponse {
  ollama_available: boolean;
  ollama_models: string[];
  ollama_url: string;
  ollama_text_model: string;
  ollama_vision_model: string;
  api_keys_configured: { mistral: boolean; groq: boolean; gemini: boolean };
  active_provider: 'ollama' | 'mistral' | 'groq' | 'gemini' | 'none';
}

export type ConfidenceMap = Record<string, number>;

export interface GuardrailIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  clause?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  modelUsed?: string;
  avgConfidence?: number;
}

