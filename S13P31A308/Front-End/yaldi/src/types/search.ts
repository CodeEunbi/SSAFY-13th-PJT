export interface Project {
imageUrl: string | null;
projectDescription: null | string;
projectKey: number;
projectName: string;
description?: string;
name?: string;
};

export interface PageInfo {
  totalElements: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
}

export interface SearchResultResponse {
  data: Project[];
  meta: PageInfo;
}