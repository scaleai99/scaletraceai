import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  TabId,
  ItemMasterForm,
  OverviewData as BaseOverviewData,
  ItemCodeData,
  DrawingsData,
  DimensionsData,
  AlternateCode,
  DocumentRecord,
  DrawingExtractionResult,
  ConfidenceMap,
  GuardrailIssue,
  AuditEntry,
} from '../types/item-master';

// Extended OverviewData with OurSys ERP additional fields
interface OverviewData extends BaseOverviewData {
  drawingFile: string;
  defaultUOM: string;
  saleableItem: boolean;
  purchaseItem: boolean;
  isEquipment: boolean;
  motherBoard: string;
  length: string;
  width: string;
  thickness: string;
  diameter: string;
  radius: string;
  weight: string;
  color: string;
  endApplication: string;
  itemGrade: string;
}

// Extended form that uses our extended OverviewData
interface ExtendedItemMasterForm extends Omit<ItemMasterForm, 'overview'> {
  overview: OverviewData;
}

// --- Helpers ------------------------------------------------------------------

function genItemCode(): string {
  const seq = String(Math.floor(Math.random() * 90) + 10).padStart(4, '0');
  return `KSS-FG-${seq}`;
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// --- Default form state --------------------------------------------------------

function defaultForm(): ExtendedItemMasterForm {
  return {
    overview: {
      partNo: '',
      customerPartNo: '',
      drawingNo: '',
      revision: '',
      partName: '',
      description: '',
      itemShortDesc: '',
      itemLongDesc: '',
      itemCategory: '',
      salesCategory: '',
      unitOfMeasure: 'Nos',
      hsnCode: '',
      minimumOrderQty: 1,
      customer: '',
      drawingStandard: 'AS9100D',
      materialSpec: '',
      surfaceTreatment: '',
      heatTreatment: '',
      specialProcess: '',
      status: 'Active',
      remarks: '',
      // OurSys ERP additional fields
      drawingFile: '',
      defaultUOM: '',
      saleableItem: false,
      purchaseItem: false,
      isEquipment: false,
      motherBoard: '',
      length: '',
      width: '',
      thickness: '',
      diameter: '',
      radius: '',
      weight: '',
      color: '',
      endApplication: '',
      itemGrade: '',
    },
    itemCodes: {
      itemCode: genItemCode(),
      prefix: 'KSS',
      suffix: '',
      customerItemCode: '',
      alternateCodes: [],
    },
    drawings: {
      drawingNumber: '',
      revisionLevel: '',
      drawingDate: '',
      drawingStandard: 'AS9100D',
      drawnBy: '',
      stepFileName: '',
      documents: [],
    },
    dimensions: {
      lengthMm: '',
      widthMm: '',
      thicknessMm: '',
      diameterMm: '',
      weightG: '',
      surfaceAreaMm2: '',
      volumeMm3: '',
      rawMaterialForm: '',
      alloyGrade: '',
      materialSpecNo: '',
      hardness: '',
      densityGcm3: '',
      tensileStrengthMpa: '',
    },
  };
}

// --- Validation ----------------------------------------------------------------

function validateForm(form: ExtendedItemMasterForm): GuardrailIssue[] {
  const issues: GuardrailIssue[] = [];

  if (!form.overview.drawingNo.trim()) {
    issues.push({
      field: 'overview.drawingNo',
      message: 'Drawing No is required',
      severity: 'error',
      clause: '7.5',
    });
  }
  if (!form.overview.partName.trim()) {
    issues.push({
      field: 'overview.partName',
      message: 'Part Name is required',
      severity: 'error',
      clause: '8.4',
    });
  }
  if (!form.overview.itemCategory) {
    issues.push({
      field: 'overview.itemCategory',
      message: 'Item Category must be selected',
      severity: 'warning',
    });
  }
  if (
    form.overview.materialSpec &&
    !/^(AMS|MIL|ASTM|BS|DIN|ISO)/i.test(form.overview.materialSpec)
  ) {
    issues.push({
      field: 'overview.materialSpec',
      message: 'Material Spec format should match AMS/MIL/ASTM/BS/DIN/ISO',
      severity: 'warning',
      clause: '8.5.1',
    });
  }
  if (!form.overview.unitOfMeasure.trim()) {
    issues.push({
      field: 'overview.unitOfMeasure',
      message: 'Unit of Measure is required',
      severity: 'error',
    });
  }

  return issues;
}

// --- Store Types ---------------------------------------------------------------

interface ItemMasterState {
  form: ExtendedItemMasterForm;
  activeTab: TabId;
  isExtracting: boolean;
  extractionProgress: number;
  extractionStatusMsg: string;
  extractionResult: DrawingExtractionResult | null;
  confidenceMap: ConfidenceMap;
  lastError: string | null;
  apiPermissionGranted: boolean;
  guardrailIssues: GuardrailIssue[];
  auditLog: AuditEntry[];
  aiFlashFields: Set<string>;
  sidebarCollapsed: boolean;

  // Actions
  setActiveTab: (tab: TabId) => void;
  updateOverview: (data: Partial<OverviewData>) => void;
  updateItemCodes: (data: Partial<ItemCodeData>) => void;
  updateDrawings: (data: Partial<DrawingsData>) => void;
  updateDimensions: (data: Partial<DimensionsData>) => void;
  addAlternateCode: () => void;
  removeAlternateCode: (id: string) => void;
  updateAlternateCode: (id: string, data: Partial<AlternateCode>) => void;
  addDocument: (doc: Omit<DocumentRecord, 'id'>) => void;
  removeDocument: (id: string) => void;
  setApiPermissionGranted: (granted: boolean) => void;
  startExtraction: () => void;
  setExtractionProgress: (pct: number, msg: string) => void;
  applyExtractionResult: (result: DrawingExtractionResult) => void;
  setExtractionError: (err: string) => void;
  clearExtraction: () => void;
  /** Clear only AI-populated fields (used before each new PDF upload so no stale data carries over). */
  clearAiFields: () => void;
  runValidation: () => void;
  resetForm: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

// --- Store ---------------------------------------------------------------------

export const useItemMasterStore = create<ItemMasterState>()(
  immer((set) => ({
    form: defaultForm(),
    activeTab: 'overview',
    isExtracting: false,
    extractionProgress: 0,
    extractionStatusMsg: '',
    extractionResult: null,
    confidenceMap: {},
    lastError: null,
    apiPermissionGranted: false,
    guardrailIssues: [],
    auditLog: [],
    aiFlashFields: new Set<string>(),
    sidebarCollapsed: false,

    setActiveTab: (tab) =>
      set((s) => {
        s.activeTab = tab;
      }),

    updateOverview: (data) =>
      set((s) => {
        Object.assign(s.form.overview, data);
      }),

    updateItemCodes: (data) =>
      set((s) => {
        Object.assign(s.form.itemCodes, data);
      }),

    updateDrawings: (data) =>
      set((s) => {
        Object.assign(s.form.drawings, data);
      }),

    updateDimensions: (data) =>
      set((s) => {
        Object.assign(s.form.dimensions, data);
      }),

    addAlternateCode: () =>
      set((s) => {
        s.form.itemCodes.alternateCodes.push({
          id: genId(),
          codeType: 'Customer Part No',
          codeValue: '',
          issuedBy: '',
          remarks: '',
        });
      }),

    removeAlternateCode: (id) =>
      set((s) => {
        s.form.itemCodes.alternateCodes = s.form.itemCodes.alternateCodes.filter(
          (c) => c.id !== id
        );
      }),

    updateAlternateCode: (id, data) =>
      set((s) => {
        const idx = s.form.itemCodes.alternateCodes.findIndex((c) => c.id === id);
        if (idx !== -1) Object.assign(s.form.itemCodes.alternateCodes[idx], data);
      }),

    addDocument: (doc) =>
      set((s) => {
        s.form.drawings.documents.push({ ...doc, id: genId() });
      }),

    removeDocument: (id) =>
      set((s) => {
        s.form.drawings.documents = s.form.drawings.documents.filter((d) => d.id !== id);
      }),

    setApiPermissionGranted: (granted) =>
      set((s) => {
        s.apiPermissionGranted = granted;
      }),

    startExtraction: () =>
      set((s) => {
        s.isExtracting = true;
        s.extractionProgress = 0;
        s.extractionStatusMsg = 'Uploading file...';
        s.lastError = null;
        s.extractionResult = null;
      }),

    setExtractionProgress: (pct, msg) =>
      set((s) => {
        s.extractionProgress = pct;
        s.extractionStatusMsg = msg;
      }),

    clearAiFields: () =>
      set((s) => {
        // Reset every field the AI extractor can populate, so switching PDFs
        // never leaves stale values from a previous drawing on the page.
        const o = s.form.overview;
        o.partNo = '';
        o.drawingNo = '';
        o.revision = '';
        o.partName = '';
        o.description = '';
        o.materialSpec = '';
        o.surfaceTreatment = '' as typeof o.surfaceTreatment;
        o.heatTreatment = '' as typeof o.heatTreatment;
        o.specialProcess = '' as typeof o.specialProcess;
        o.customer = '';
        o.length = '';
        o.width = '';
        o.thickness = '';
        o.diameter = '';
        o.radius = '';
        o.weight = '';
        const d = s.form.drawings;
        d.drawingNumber = '';
        d.revisionLevel = '';
        d.drawingDate = '';
        d.drawnBy = '';
        const dim = s.form.dimensions;
        dim.lengthMm = '';
        dim.widthMm = '';
        dim.thicknessMm = '';
        dim.diameterMm = '';
        dim.weightG = '';
        dim.surfaceAreaMm2 = '';
        dim.volumeMm3 = '';
        dim.alloyGrade = '';
        dim.materialSpecNo = '';
        dim.hardness = '';
        s.confidenceMap = {};
        s.aiFlashFields = new Set<string>();
        s.extractionResult = null;
        s.lastError = null;
        s.guardrailIssues = validateForm(s.form);
      }),

    applyExtractionResult: (result) => {
      const flashKeys = new Set<string>();
      const confidence: ConfidenceMap = {};

      function maybeStr(f: { value: string | number | null; confidence: number } | undefined): string {
        if (!f) return '';
        return f.value !== null ? String(f.value) : '';
      }

      set((s) => {
        // Overview mappings
        if (result.drawing_number?.value) {
          s.form.overview.drawingNo = maybeStr(result.drawing_number);
          s.form.drawings.drawingNumber = maybeStr(result.drawing_number);
          confidence['overview.drawingNo'] = result.drawing_number.confidence;
          confidence['drawings.drawingNumber'] = result.drawing_number.confidence;
          flashKeys.add('overview.drawingNo');
          flashKeys.add('drawings.drawingNumber');
          // also set partNo = drawing number (item no comes from drawing)
          s.form.overview.partNo = maybeStr(result.drawing_number);
          confidence['overview.partNo'] = result.drawing_number.confidence;
          flashKeys.add('overview.partNo');
        }
        if (result.revision?.value) {
          s.form.overview.revision = maybeStr(result.revision);
          s.form.drawings.revisionLevel = maybeStr(result.revision);
          confidence['overview.revision'] = result.revision.confidence;
          confidence['drawings.revisionLevel'] = result.revision.confidence;
          flashKeys.add('overview.revision');
          flashKeys.add('drawings.revisionLevel');
        }
        if (result.part_name?.value) {
          s.form.overview.partName = maybeStr(result.part_name);
          s.form.overview.description = maybeStr(result.part_name);
          confidence['overview.partName'] = result.part_name.confidence;
          confidence['overview.description'] = result.part_name.confidence;
          flashKeys.add('overview.partName');
          flashKeys.add('overview.description');
        }
        if (result.material_spec?.value) {
          s.form.overview.materialSpec = maybeStr(result.material_spec);
          confidence['overview.materialSpec'] = result.material_spec.confidence;
          flashKeys.add('overview.materialSpec');
        }
        if (result.surface_treatment?.value) {
          s.form.overview.surfaceTreatment = maybeStr(result.surface_treatment) as typeof s.form.overview.surfaceTreatment;
          confidence['overview.surfaceTreatment'] = result.surface_treatment.confidence;
          flashKeys.add('overview.surfaceTreatment');
        }
        if (result.heat_treatment?.value) {
          s.form.overview.heatTreatment = maybeStr(result.heat_treatment) as typeof s.form.overview.heatTreatment;
          confidence['overview.heatTreatment'] = result.heat_treatment.confidence;
          flashKeys.add('overview.heatTreatment');
        }
        if (result.special_process?.value) {
          s.form.overview.specialProcess = maybeStr(result.special_process) as typeof s.form.overview.specialProcess;
          confidence['overview.specialProcess'] = result.special_process.confidence;
          flashKeys.add('overview.specialProcess');
        }
        if (result.customer_name?.value) {
          s.form.overview.customer = maybeStr(result.customer_name);
          confidence['overview.customer'] = result.customer_name.confidence;
          flashKeys.add('overview.customer');
        }

        // Drawings
        if (result.drawing_date?.value) {
          s.form.drawings.drawingDate = maybeStr(result.drawing_date);
          confidence['drawings.drawingDate'] = result.drawing_date.confidence;
          flashKeys.add('drawings.drawingDate');
        }
        if (result.drawn_by?.value) {
          s.form.drawings.drawnBy = maybeStr(result.drawn_by);
          confidence['drawings.drawnBy'] = result.drawn_by.confidence;
          flashKeys.add('drawings.drawnBy');
        }

        // Dimensions
        if (result.length_mm?.value) {
          s.form.dimensions.lengthMm = maybeStr(result.length_mm);
          s.form.overview.length = maybeStr(result.length_mm);
          confidence['dimensions.lengthMm'] = result.length_mm.confidence;
          confidence['overview.length'] = result.length_mm.confidence;
          flashKeys.add('dimensions.lengthMm');
          flashKeys.add('overview.length');
        }
        if (result.width_mm?.value) {
          s.form.dimensions.widthMm = maybeStr(result.width_mm);
          s.form.overview.width = maybeStr(result.width_mm);
          confidence['dimensions.widthMm'] = result.width_mm.confidence;
          confidence['overview.width'] = result.width_mm.confidence;
          flashKeys.add('dimensions.widthMm');
          flashKeys.add('overview.width');
        }
        if (result.thickness_mm?.value) {
          s.form.dimensions.thicknessMm = maybeStr(result.thickness_mm);
          s.form.overview.thickness = maybeStr(result.thickness_mm);
          confidence['dimensions.thicknessMm'] = result.thickness_mm.confidence;
          confidence['overview.thickness'] = result.thickness_mm.confidence;
          flashKeys.add('dimensions.thicknessMm');
          flashKeys.add('overview.thickness');
        }
        if (result.diameter_mm?.value) {
          s.form.dimensions.diameterMm = maybeStr(result.diameter_mm);
          s.form.overview.diameter = maybeStr(result.diameter_mm);
          confidence['dimensions.diameterMm'] = result.diameter_mm.confidence;
          confidence['overview.diameter'] = result.diameter_mm.confidence;
          flashKeys.add('dimensions.diameterMm');
          flashKeys.add('overview.diameter');
        }
        if (result.radius_mm?.value) {
          s.form.overview.radius = maybeStr(result.radius_mm);
          confidence['overview.radius'] = result.radius_mm.confidence;
          flashKeys.add('overview.radius');
        }
        if (result.weight_g?.value) {
          s.form.dimensions.weightG = maybeStr(result.weight_g);
          s.form.overview.weight = maybeStr(result.weight_g);
          confidence['dimensions.weightG'] = result.weight_g.confidence;
          confidence['overview.weight'] = result.weight_g.confidence;
          flashKeys.add('dimensions.weightG');
          flashKeys.add('overview.weight');
        }
        if (result.surface_area_mm2?.value) {
          s.form.dimensions.surfaceAreaMm2 = maybeStr(result.surface_area_mm2);
          confidence['dimensions.surfaceAreaMm2'] = result.surface_area_mm2.confidence;
          flashKeys.add('dimensions.surfaceAreaMm2');
        }
        if (result.volume_mm3?.value) {
          s.form.dimensions.volumeMm3 = maybeStr(result.volume_mm3);
          confidence['dimensions.volumeMm3'] = result.volume_mm3.confidence;
          flashKeys.add('dimensions.volumeMm3');
        }
        if (result.alloy_grade?.value) {
          s.form.dimensions.alloyGrade = maybeStr(result.alloy_grade);
          confidence['dimensions.alloyGrade'] = result.alloy_grade.confidence;
          flashKeys.add('dimensions.alloyGrade');
        }
        if (result.material_spec_no?.value) {
          s.form.dimensions.materialSpecNo = maybeStr(result.material_spec_no);
          confidence['dimensions.materialSpecNo'] = result.material_spec_no.confidence;
          flashKeys.add('dimensions.materialSpecNo');
        }
        if (result.hardness?.value) {
          s.form.dimensions.hardness = maybeStr(result.hardness);
          confidence['dimensions.hardness'] = result.hardness.confidence;
          flashKeys.add('dimensions.hardness');
        }

        s.confidenceMap = confidence;
        s.aiFlashFields = flashKeys;
        s.extractionResult = result;
        s.isExtracting = false;
        s.extractionProgress = 100;
        s.extractionStatusMsg = 'Extraction complete';

        // Audit log entry
        const confValues = Object.values(confidence);
        const avgConf =
          confValues.length > 0
            ? Math.round((confValues.reduce((a, b) => a + b, 0) / confValues.length) * 100)
            : 0;
        s.auditLog.unshift({
          id: genId(),
          timestamp: new Date().toISOString(),
          action: 'AI Extraction',
          details: `Extracted ${flashKeys.size} fields from drawing`,
          modelUsed: result.model_used,
          avgConfidence: avgConf,
        });

        // Validate after fill
        s.guardrailIssues = validateForm(s.form);
      });

      // Clear flash fields after 2 seconds
      setTimeout(() => {
        set((s) => {
          s.aiFlashFields = new Set<string>();
        });
      }, 2000);
    },

    setExtractionError: (err) =>
      set((s) => {
        s.lastError = err;
        s.isExtracting = false;
        s.extractionProgress = 0;
        s.extractionStatusMsg = '';
      }),

    clearExtraction: () =>
      set((s) => {
        s.extractionResult = null;
        s.isExtracting = false;
        s.extractionProgress = 0;
        s.extractionStatusMsg = '';
        s.lastError = null;
      }),

    runValidation: () =>
      set((s) => {
        s.guardrailIssues = validateForm(s.form);
      }),

    resetForm: () =>
      set((s) => {
        s.form = defaultForm();
        s.confidenceMap = {};
        s.aiFlashFields = new Set<string>();
        s.extractionResult = null;
        s.isExtracting = false;
        s.extractionProgress = 0;
        s.extractionStatusMsg = '';
        s.lastError = null;
        s.guardrailIssues = [];
      }),

    setSidebarCollapsed: (v) =>
      set((s) => {
        s.sidebarCollapsed = v;
      }),
  }))
);

// Selector helpers
export const selectAiFieldCount = (s: ItemMasterState) => Object.keys(s.confidenceMap).length;
export const selectLowConfidenceCount = (s: ItemMasterState) =>
  Object.values(s.confidenceMap).filter((c) => c < 0.7).length;

