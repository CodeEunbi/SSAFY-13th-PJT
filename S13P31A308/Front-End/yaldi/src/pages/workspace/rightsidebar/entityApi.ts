import { apiController } from '../../../apis/apiController';

interface RelatedTable {
  tableKey: number;
  physicalName: string;
  logicalName: string;
  displayName: string;
}

export interface EntityResponse {
  modelKey: number;
  projectKey: number;
  name: string;
  type: string;
  syncStatus: string;
  syncMessage: string;
  lastSyncedAt: string;
  relatedTables: RelatedTable[];
  columnCount: number;
  createdAt: string;
  updatedAt: string;
}

// Entity API 함수
export const createEntity = async (
  projectKey: number,
  tableKey: number,
): Promise<EntityResponse> => {
  try {
    const response = await apiController({
      url: `/api/v1/projects/${projectKey}/data-models/entity`,
      method: 'post',
      data: {
        tableKey,
      },
    });

    console.log('Entity 생성 성공', response);
    return response.data.result;
  } catch (error) {
    console.error('Entity API 호출 실패:', error);
    throw error;
  }
};
