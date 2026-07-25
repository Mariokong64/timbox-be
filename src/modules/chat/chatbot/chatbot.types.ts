export interface ChatbotRequest {
  mensaje?: unknown;
}

export interface ChatbotResponse {
  respuesta: string;
  modelo: string;
}

export interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}
