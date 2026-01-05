/**
 * API client for TraceScribe backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiError {
  detail: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      ...options.headers,
    };

    // Add auth token if available
    if (this.authToken) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.authToken}`;
    }

    // Add content-type for JSON requests (not for FormData)
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = {
        detail: "An error occurred",
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.detail = errorData.detail || error.detail;
      } catch {
        // Ignore JSON parse errors
      }

      throw error;
    }

    return response.json();
  }

  // ============================================================================
  // Health
  // ============================================================================

  async healthCheck(): Promise<{ status: string; app: string; version: string }> {
    return this.request("/api/health");
  }

  // ============================================================================
  // Protocols
  // ============================================================================

  async uploadProtocol(file: File, options?: { force?: boolean }): Promise<ProtocolUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    let url = "/api/protocols/upload";
    if (options?.force) {
      url += "?force=true";
    }

    return this.request(url, {
      method: "POST",
      body: formData,
    });
  }

  async listProtocols(skip = 0, limit = 50): Promise<ProtocolListResponse> {
    return this.request(`/api/protocols?skip=${skip}&limit=${limit}`);
  }

  async getProtocol(id: string): Promise<ProtocolResponse> {
    return this.request(`/api/protocols/${id}`);
  }

  async deleteProtocol(id: string): Promise<{ status: string; id: string }> {
    return this.request(`/api/protocols/${id}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // Documents
  // ============================================================================

  async generateDocument(
    protocolId: string,
    documentType: "icf" | "dmp" | "sap"
  ): Promise<DocumentGenerateResponse> {
    return this.request("/api/documents/generate", {
      method: "POST",
      body: JSON.stringify({
        protocol_id: protocolId,
        document_type: documentType,
      }),
    });
  }

  async listDocuments(
    protocolId?: string,
    skip = 0,
    limit = 50
  ): Promise<DocumentListResponse> {
    let url = `/api/documents?skip=${skip}&limit=${limit}`;
    if (protocolId) {
      url += `&protocol_id=${protocolId}`;
    }
    return this.request(url);
  }

  async getDocument(id: string): Promise<DocumentResponse> {
    return this.request(`/api/documents/${id}`);
  }

  async downloadDocument(id: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/documents/${id}/download`;
    const headers: HeadersInit = {};

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error("Failed to download document");
    }

    return response.blob();
  }

  async translateDocument(
    documentId: string,
    targetLanguage: string
  ): Promise<DocumentTranslateResponse> {
    return this.request(`/api/documents/${documentId}/translate`, {
      method: "POST",
      body: JSON.stringify({
        target_language: targetLanguage,
      }),
    });
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  async createCheckoutSession(
    priceId: string
  ): Promise<{ checkout_url: string }> {
    return this.request("/api/subscriptions/create-checkout", {
      method: "POST",
      body: JSON.stringify({ price_id: priceId }),
    });
  }

  async getSubscription(): Promise<SubscriptionResponse> {
    return this.request("/api/subscriptions/current");
  }

  async cancelSubscription(): Promise<{ status: string }> {
    return this.request("/api/subscriptions/cancel", {
      method: "POST",
    });
  }
}

// ============================================================================
// Types
// ============================================================================

export interface ProtocolUploadResponse {
  id: string;
  title: string;
  protocol_number: string | null;
  sponsor: string | null;
  status: string;
  extracted_data: ExtractedProtocol;
  confidence_flags: string[];
}

export interface ProtocolResponse {
  id: string;
  user_id: string;
  title: string;
  protocol_number: string | null;
  sponsor: string | null;
  file_path: string;
  extracted_data: ExtractedProtocol | null;
  created_at: string;
}

export interface ProtocolListResponse {
  protocols: ProtocolResponse[];
  total: number;
}

export interface ExtractedProtocol {
  metadata: {
    protocol_number: string | null;
    title: string;
    sponsor: string | null;
    phase: string | null;
    indication: string | null;
    version: string | null;
  };
  design: {
    study_type: string;
    design: string | null;
    arms: string[];
    randomization_ratio: string | null;
    blinding: string | null;
    control: string | null;
    planned_enrollment: number | null;
    study_duration_weeks: number | null;
  };
  endpoints: {
    primary: string[];
    secondary: string[];
  };
  eligibility: {
    inclusion: string[];
    exclusion: string[];
    age_range: string | null;
    sex: string | null;
  };
  procedures: Array<{
    name: string;
    plain_language: string | null;
    frequency: string | null;
    visits: string[];
    blood_volume_ml: number | null;
  }>;
  visits: Array<{
    name: string;
    timing: string | null;
    procedures: string[];
    estimated_duration_hours: number | null;
  }>;
  adverse_events: Array<{
    term: string;
    plain_language: string | null;
    frequency: string | null;
    severity: string | null;
  }>;
  investigational_product: {
    name: string;
    type: string | null;
    route: string | null;
    dose: string | null;
    frequency: string | null;
    duration: string | null;
  } | null;
  confidence_flags: string[];
}

export interface DocumentResponse {
  id: string;
  protocol_id: string;
  user_id: string;
  document_type: string;
  version: number;
  file_path: string;
  status: string;
  created_at: string;
  file_size?: number;
  language: string;
  source_document_id?: string;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
}

export interface DocumentGenerateResponse {
  id: string;
  document_type: string;
  status: string;
  message: string;
}

export interface DocumentTranslateResponse {
  id: string;
  source_document_id: string;
  target_language: string;
  status: string;
  message: string;
}

export interface SubscriptionResponse {
  id: string;
  status: string;
  plan: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

// Export singleton instance
export const api = new ApiClient();
export default api;
