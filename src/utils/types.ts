export interface Position {
  x: number;
  y: number;
}

export interface EnhancedPosition extends Position {
  useRightBottom?: boolean;
  right?: number;
  bottom?: number;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Position;
  offset: Position;
  hasMoved: boolean;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}

// AI Extraction Types
export interface ExtractedJobData {
  company: string;
  position: string;
  jobDescription: string;
}

export interface PreExtractedData {
  data: ExtractedJobData;
  timestamp: number;
  url: string;
}

// Global Window Interface Extensions
declare global {
  interface Window {
    preExtractedJobData?: PreExtractedData;
    extractionInProgress?: Promise<ExtractedJobData>;
    preExtractedJobDataCache?: { [url: string]: PreExtractedData };
    extractionState?: {
      isExtracting: boolean;
      lastExtractionUrl: string;
      lastExtractionTime: number;
      extractionCount: number;
    };
  }
}

// Service Worker Message Types
export interface GraphQLMessage {
  action: "graphqlRequest";
  query: string;
  variables?: Record<string, unknown>;
  useCache?: boolean;
  cacheTTL?: number;
  requestId?: string;
  timestamp?: number;
}

export interface AuthMessage {
  action: "authenticate";
  credentials: {
    email: string;
    password: string;
  };
  requestId?: string;
}

export interface CacheInvalidateMessage {
  action: "invalidateCache";
  pattern?: string;
}

export type ExtensionMessage =
  | GraphQLMessage
  | AuthMessage
  | CacheInvalidateMessage;

// Cache Management Types
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}
