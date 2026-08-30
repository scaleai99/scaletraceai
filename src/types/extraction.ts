/**
 * Types for Module 05 - AI Drawing Reader extraction results
 * and Module 06 - Specification AI detections.
 */

// ---------------------------------------------------------------------------
// Drawing Extraction
// ---------------------------------------------------------------------------

/** A single extracted field with its AI confidence score. */
export interface ExtractionField {
  value: string | null
  confidence: number
}

/**
 * Full result returned by POST /api/v1/drawings/extract or
 * from the extraction service cache.
 */
export interface ExtractionResult {
  part_number: ExtractionField
  drawing_number: ExtractionField
  revision: ExtractionField
  part_name: ExtractionField
  material_spec: ExtractionField
  dimensions: ExtractionField
  special_processes: ExtractionField
  surface_treatment: ExtractionField
  bom_items: ExtractionField
  _meta: {
    model_used: string
    routing: string
    processing_ms: number
  }
  /** UUID of the DrawingExtraction DB row (set by extraction service). */
  _db_id?: string
  /** 'cache' | 'extraction' */
  _source?: string
}

// ---------------------------------------------------------------------------
// Specification Detection
// ---------------------------------------------------------------------------

export interface SpecDetection {
  spec_number: string
  family: string
  spec_title?: string | null
  process_category: string | null
  scale_qualified: boolean
  qualification_expiry?: string | null
  is_unknown: boolean
}

// ---------------------------------------------------------------------------
// Batch Upload
// ---------------------------------------------------------------------------

export interface BatchUploadResponse {
  job_id: string
  total: number
  status: 'processing' | 'completed'
}

export interface BatchJobStatus {
  job_id: string
  total: number
  processed: number
  failed: Array<{ filename: string; error: string }>
  completed: Array<{ filename: string; db_id: string | null; status: string }>
  status: 'processing' | 'completed'
}
