import type {
  CreateTableRequest,
  CreateTableResponse,
  GetTablesResponse,
  CreateColumnRequest,
  CreateColumnResponse,
  UpdateColumnRequest,
  UpdateColumnResponse,
  CreateRelationRequest,
  CreateRelationResponse,
} from '../types/table';
import { apiController } from './apiController';

/**
 * 테이블 생성 API
 * @param data 테이블 생성 요청 데이터
 * @returns 생성된 테이블 정보
 */
export const createTable = async (
  data: CreateTableRequest,
): Promise<CreateTableResponse> => {
  console.log('테이블 생성 API 호출 데이터:', data);

  const requestBody = {
    projectKey: data.projectKey,
    logicalName: data.logicalName,
    physicalName: data.physicalName,
    xPosition: data.xPosition,
    yPosition: data.yPosition,
    colorHex: data.colorHex,
  };

  console.log('실제 전송할 body:', requestBody);

  try {
    const response = await apiController({
      url: `/api/v1/erd/projects/${data.projectKey}/tables`,
      method: 'post',
      data: requestBody,
    });

    console.log('테이블 생성 성공:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('테이블 생성 API 호출 실패:', error);
    throw error;
  }
};


/**
 * 테이블 조회 API
 * @param projectKey 프로젝트 키
 * @returns 테이블, 컬럼, 관계 정보
 */
export const getTables = async (
  projectKey: number,
): Promise<GetTablesResponse> => {
  console.log('테이블 조회 API 호출, projectKey:', projectKey);

  try {
    const response = await apiController({
      url: `/api/v1/erd/projects/${projectKey}`,
      method: 'get',
    })
    console.log('테이블 조회 성공:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('테이블 조회 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 테이블 삭제 API
 * @param tableKey 삭제할 테이블 키
 */
export const deleteTable = async (tableKey: number): Promise<void> => {
  console.log('테이블 삭제 API 호출, tableKey:', tableKey);

  try {
    await apiController({
      url: `/api/v1/erd/tables/${tableKey}`,
      method: 'delete',
    });

    console.log('테이블 삭제 성공');
  } catch (error) {
    console.error('테이블 삭제 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 컬럼 생성 API
 * @param tableKey 테이블 키
 * @param data 컬럼 생성 요청 데이터
 * @returns 생성된 컬럼 정보
 */
export const createColumn = async (
  tableKey: number,
  data: CreateColumnRequest,
): Promise<CreateColumnResponse> => {
  console.log('컬럼 생성 API 호출 데이터:', { tableKey, data });

  const requestBody = {
    isPrimaryKey: data.isPrimaryKey,
    isForeignKey: data.isForeignKey ?? false,
  };

  console.log('실제 전송할 body:', requestBody);

  try {
    const response = await apiController({
      url: `/api/v1/erd/tables/${tableKey}/columns`,
      method: 'post',
      data: requestBody,
    });

    console.log('컬럼 생성 성공:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('컬럼 생성 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 컬럼 삭제 API
 * @param columnKey 삭제할 컬럼 키
 */
export const deleteColumn = async (columnKey: number): Promise<void> => {
  console.log('컬럼 삭제 API 호출, columnKey:', columnKey);

  try {
    await apiController({
      url: `/api/v1/erd/columns/${columnKey}`,
      method: 'delete',
    });

    console.log('컬럼 삭제 성공');
  } catch (error) {
    console.error('컬럼 삭제 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 컬럼 수정 API
 * @param columnKey 수정할 컬럼 키
 * @param data 컬럼 수정 요청 데이터
 * @returns 수정된 컬럼 정보
 */
export const updateColumn = async (
  columnKey: number,
  data: UpdateColumnRequest,
): Promise<UpdateColumnResponse> => {
  console.log('컬럼 수정 API 호출 데이터:', { columnKey, data });

  try {
    const response = await apiController({
      url: `/api/v1/erd/columns/${columnKey}`,
      method: 'patch',
      data,
    });

    console.log('컬럼 수정 성공:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('컬럼 수정 API 호출 실패:', error);
    throw error;
  }
};

/**
 * 관계선 생성 API
 * @param projectKey 프로젝트 키
 * @param data 관계선 생성 요청 데이터
 * @returns 생성된 관계선 정보
 */
export const createRelation = async (
  projectKey: number,
  data: CreateRelationRequest,
): Promise<CreateRelationResponse> => {
  console.log('관계선 생성 API 호출 데이터:', { projectKey, data });

  const requestBody = {
    fromTableKey: data.fromTableKey,
    fromColumnKey: data.fromColumnKey,
    toTableKey: data.toTableKey,
    relationType: data.relationType,
    constraintName: data.constraintName,
    onDeleteAction: data.onDeleteAction,
    onUpdateAction: data.onUpdateAction,
  };

  console.log('실제 전송할 body:', requestBody);

  try {
    const response = await apiController({
      url: `/api/v1/erd/projects/${projectKey}/relations`,
      method: 'post',
      data: requestBody,
    });

    console.log('관계선 생성 성공:', response.data.result);
    return response.data.result;
  } catch (error) {
    console.error('관계선 생성 API 호출 실패:', error);
    throw error;
  }
};
