import type { DrawingExtractionResult, AiStatusResponse } from '../types/item-master';

// All routes go through the Vite proxy (/api -> http://localhost:8001)
// or nginx in production. URLs must match the backend router prefixes:
//   POST /api/v1/drawings/extract  - drawing extraction
//   GET  /api/v1/drawings/status   - AI provider availability
const EXTRACT_URL  = '/api/v1/drawings/extract';
const AI_STATUS_URL = '/api/v1/drawings/status';

export class OnPremiseUnavailableError extends Error {
  ollamaUrl: string;
  constructor(url: string) {
    super('Ollama not running');
    this.name = 'OnPremiseUnavailableError';
    this.ollamaUrl = url;
  }
}

export async function fetchAiStatus(): Promise<AiStatusResponse> {
  const resp = await fetch(AI_STATUS_URL);
  if (!resp.ok) throw new Error(`AI status check failed: ${resp.status}`);
  return resp.json() as Promise<AiStatusResponse>;
}

export async function extractDrawing(
  file: File,
  allowApiFallback: boolean,
  onProgress: (pct: number, msg: string) => void
): Promise<DrawingExtractionResult> {
  // Simulate progress phases while the actual request runs
  const phases: Array<[number, string]> = [
    [10, 'Uploading file...'],
    [30, 'Reading PDF text...'],
    [50, 'Sending to Ollama (on-premise)...'],
    [65, 'AI processing drawing...'],
    [80, 'Parsing AI response...'],
    [90, 'Validating extracted fields...'],
  ];

  let phaseIndex = 0;
  const progressInterval = setInterval(() => {
    if (phaseIndex < phases.length) {
      const [pct, msg] = phases[phaseIndex];
      onProgress(pct, msg);
      phaseIndex++;
    }
  }, 600);

  try {
    const formData = new FormData();
    formData.append('file', file);
    // allow_api_fallback is not used by the on-premise backend, but kept for compat
    formData.append('allow_api_fallback', String(allowApiFallback));

    const response = await fetch(EXTRACT_URL, {
      method: 'POST',
      body: formData,
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as Record<string, unknown>;
      const detail = (errBody?.detail ?? errBody?.message ?? `Request failed: ${response.status}`) as string;
      throw new Error(detail);
    }

    onProgress(100, 'Extraction complete');
    return response.json() as Promise<DrawingExtractionResult>;
  } catch (err) {
    clearInterval(progressInterval);
    throw err;
  }
}
