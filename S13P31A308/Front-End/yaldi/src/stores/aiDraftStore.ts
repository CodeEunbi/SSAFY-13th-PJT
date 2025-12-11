import { create } from "zustand";
import type { WorkspaceTable } from "../pages/workspace/WorkSpace";

export interface AiDraftRequest {
    projectName: string;
    projectDescription?: string;
    userPrompt: string;
}

export interface AiDraftTable {
    logicalName: string;
    phygicalName: string;
    columns: Array<{
        logicalName: string;
        pysicalName: string;
        type: string;
        constraints: string[];
    }>;
    indexes?: Array<{
        name: string;
        column: string;
    } | string>;
}

export interface AiDraftRelation {
    fromTable: string;
    toTable: string;
    fromColumn: string;
    toColumn: string;
    type: string;
}

export interface AiDraftGeneratedSchema {
    tables: AiDraftTable[];
    relations: AiDraftRelation[];
};

export interface AiDraftResult {
    mode: string;
    explanation: string;
    similarity_score: number;
    generated_schema: AiDraftGeneratedSchema;
    sql_script: string;
    validation_report?: {
        agent: string;
        issues: string[];
        is_valid: boolean;
        thought: string;
    };
    optimization_suggestions?: unknown;
}

interface AiDraftStore {
    isAiAssistNeed: boolean;
    aiDraftData: AiDraftRequest | null;
    aiDraftResult: AiDraftResult | null;
    previewTables: WorkspaceTable[];
    setAiDraftData: (data: AiDraftRequest) => void;
    clearAiDraftData: () => void;
    setAiDraftResult: (result: AiDraftResult) => void;
    setPreviewTables: (tables: WorkspaceTable[]) => void;
    clearAiDraft: () => void;
}

export const useAiDraftStore = create<AiDraftStore>((set) => ({
    isAiAssistNeed: false,
    aiDraftData: null,
    aiDraftResult: null,
    previewTables: [],
    setAiDraftData: (data) => set({ isAiAssistNeed: true, aiDraftData: data }),
    clearAiDraftData: () => set({ isAiAssistNeed: false, aiDraftData: null }),
    setAiDraftResult: (result) => set({ aiDraftResult: result }),
    setPreviewTables: (tables) => set({ previewTables: tables }),
    clearAiDraft: () => set({ isAiAssistNeed: false, aiDraftResult: null, previewTables: [] }),
}));