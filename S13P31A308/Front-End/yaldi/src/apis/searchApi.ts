import { apiController } from "./apiController";
import type { Project } from "../types/search";

export const fetchSearchResults = async (query: string): Promise<Project[]> => {
  if (!query) {
    return [];
  };

  try {

    const response = await apiController({
      url: `/api/v1/search/projects`,
      method: 'get',
      params: {
        query,
      }
    })

    console.log(query, "검색 성공", response);
    return response.data.result;

  } catch (error) {
    console.error("검색 API 호출 실패:", error);
    throw error;
  }
};