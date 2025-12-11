import { create } from "zustand";
import type { WorkspaceTable } from "../pages/workspace/WorkSpace";

interface ColumnConstraint {
  name: string;
  type: string;
  constraints: string[] | null;
}

interface TableSchema {
  name: string;
  columns: ColumnConstraint[];
}

interface CorrectedSchema {
  tables: TableSchema[];
}

interface Suggestion {
  type: string;
  table: string;
  original: string;
  suggested: string;
  reason: string;
}

interface ValidationResult {
  originalError: string | null;
  userFriendlyMessage: string;
  correctedSchema: CorrectedSchema;
  suggestions: Suggestion[] | null;
}

type Status = "success" | "error" | "warning";

export interface ValidationResponse {
  requestId: string;
  status: Status;
  hasErrors: boolean;
  processedAt: string;
  validationResult: ValidationResult;
}

interface AiImportStore {
  jobId: string | null;
  isLoading: boolean;
  validationResult: ValidationResponse | null;
  previewTables: WorkspaceTable[] | null;
  setJobId: (jobId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setValidationResult: (result: ValidationResponse) => void;
  setPreviewTables: (tables: WorkspaceTable[]) => void;
  clearImport: () => void;
}

export const useAiImportStore = create<AiImportStore>((set) => ({
  jobId: null,
  isLoading: false,
  validationResult: null,
  previewTables: null,
  setJobId: (jobId) => set({ jobId, isLoading: true }),
  setLoading: (isLoading) => set({ isLoading }),
  setValidationResult: (result) => set({ validationResult: result, isLoading: false }),
  setPreviewTables: (tables) => set({ previewTables: tables }),
  clearImport: () => set({ jobId: null, isLoading: false, validationResult: null, previewTables: null }),
}));