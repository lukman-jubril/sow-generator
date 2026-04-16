/**
 * Presales AI SOW Generator - API Service
 * Base URL: https://sow-gen.onrender.com
 *
 * Asynchronous flow:
 * 1. POST /generate-sow → returns job_id immediately
 * 2. Poll GET /status/{job_id} every 5-10 seconds
 * 3. When completed: GET /download/{job_id} for DOCX
 */

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://sow-gen.onrender.com";
};

// --- API Response Types ---

export interface GenerateResponse {
  job_id: string;
  status: "queued";
}

export interface GenerateSowSuccessResponse {
  status: "success";
  message: string;
  download_url: string; // may be relative (e.g. "/download/...")
  output_filename: string;
}

export type StartJobResponse = GenerateResponse | GenerateSowSuccessResponse;

export interface GenerateSowRequest {
  client_name: string;
  project_title: string;
  project_description: string;
  aws_services: string;
  timeline_weeks: number;
  sponsor_name?: string;
  sponsor_title?: string;
  sponsor_email?: string;
  context_text: string;
}

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface StatusResponse {
  job_id: string;
  status: JobStatus;
  error?: string;
  completed_at?: string;
  docx_path?: string;
  markdown?: string;
  s3_url?: string;
  diagram_path?: string | null;
  client_name?: string;
  generated_at?: string;
  markdown_path?: string;
  project_date?: string;
  project_title?: string;
}

export interface ApiError {
  detail: string;
}

// --- API Functions ---

/**
 * Start a new SOW generation job
 * @param payload - SOW generation request payload
 * @returns Either a queued job_id (async) or a success response with download_url
 */
export async function startJob(
  payload: GenerateSowRequest,
): Promise<StartJobResponse> {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/generate-sow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail =
      (errorBody as ApiError).detail ||
      `API request failed with status ${response.status}`;
    throw new Error(detail);
  }

  const data = (await response.json()) as StartJobResponse;
  if ("download_url" in data && typeof data.download_url === "string") {
    return data;
  }
  if ("job_id" in data && typeof data.job_id === "string") {
    return data;
  }
  throw new Error("Invalid API response: missing job_id/download_url");
}

/**
 * Fetch current job status
 */
export async function getJobStatus(jobId: string): Promise<StatusResponse> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/status/${jobId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Job not found. It may have expired.");
    }
    const errorBody = await response.json().catch(() => ({}));
    const detail =
      (errorBody as ApiError).detail ||
      `Status check failed with status ${response.status}`;
    throw new Error(detail);
  }

  return response.json() as Promise<StatusResponse>;
}

/**
 * Get the URL to download the generated DOCX file
 */
export function getDownloadUrl(jobId: string): string {
  const baseUrl = getBaseUrl();
  if (/^https?:\/\//i.test(jobId)) return jobId;
  if (jobId.startsWith("/")) return `${baseUrl}${jobId}`;
  if (jobId.startsWith("download/")) return `${baseUrl}/${jobId}`;
  return `${baseUrl}/download/${jobId}`;
}

/**
 * Download the generated DOCX file as a blob (for programmatic download)
 */
export async function downloadDocx(jobId: string): Promise<Blob> {
  const url = getDownloadUrl(jobId);
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Download not available. File may have expired.");
    }
    throw new Error(`Download failed with status ${response.status}`);
  }

  return response.blob();
}

/**
 * Poll job status until completed or failed
 * @param jobId - Job ID from startJob
 * @param onStatusUpdate - Callback for progress (queued, running, etc.)
 * @param options - Poll interval (ms), timeout (ms)
 */
export async function pollUntilComplete(
  jobId: string,
  onStatusUpdate: (status: StatusResponse) => void,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<StatusResponse> {
  const { intervalMs = 7000, timeoutMs = 20 * 60 * 1000 } = options; // 7s interval, 20min timeout
  const startTime = Date.now();

  const poll = async (): Promise<StatusResponse> => {
    const elapsed = Date.now() - startTime;
    if (elapsed > timeoutMs) {
      throw new Error(
        "Generation is taking longer than expected. Please try again later."
      );
    }

    const status = await getJobStatus(jobId);
    onStatusUpdate(status);

    if (status.status === "completed") {
      return status;
    }

    if (status.status === "failed") {
      throw new Error(status.error || "Job failed");
    }

    // Still queued or running - poll again
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    return poll();
  };

  return poll();
}

/**
 * Optional: Check API health (if /health endpoint exists)
 */
export async function checkHealth(): Promise<boolean> {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
