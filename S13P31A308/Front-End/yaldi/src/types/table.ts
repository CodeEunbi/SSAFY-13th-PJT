// 테이블 생성 요청 타입
export interface CreateTableRequest {
  projectKey: number;
  logicalName: string;
  physicalName: string;
  xPosition: number;
  yPosition: number;
  colorHex: string;
}

// 테이블 생성 응답 타입
export interface CreateTableResponse {
  tableKey: number;
  projectKey: number;
  logicalName: string;
  physicalName: string;
  xPosition: number;
  yPosition: number;
  colorHex: string;
}


// 컬럼 타입
export interface Column {
  columnKey: number;
  tableKey: number;
  logicalName: string;
  physicalName: string;
  dataType: string;
  dataDetail: string[] | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIncremental: boolean;
  defaultValue: string | null;
  comment: string;
  columnOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 테이블 타입
export interface Table {
  tableKey: number;
  projectKey: number;
  logicalName: string;
  physicalName: string;
  colorHex: string;
  createdAt: string;
  updatedAt: string;
  xposition: number;
  yposition: number;
}

// 관계 타입
export interface Relation {
  relationKey: number;
  projectKey: number;
  fromTableKey: number;
  fromColumnKey: number | null;
  toTableKey: number;
  toColumnKey: number | null;
  relationType: string;
  constraintName: string;
  onDeleteAction: string;
  onUpdateAction: string;
  createdAt: string;
  updatedAt: string;
}

// 테이블 조회 응답 타입
export interface GetTablesResponse {
  projectKey: number;
  tables: Table[];
  columns: Column[];
  relations: Relation[];
}

// 컬럼 생성 요청 타입
export interface CreateColumnRequest {
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

// 컬럼 생성 응답 타입
export interface CreateColumnResponse {
  columnKey: number;
  tableKey: number;
  logicalName: string;
  physicalName: string;
  dataType: string;
  dataDetail: string[] | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIncremental: boolean;
  defaultValue: string | null;
  comment: string;
  columnOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 컬럼 수정 요청 타입
export interface UpdateColumnRequest {
  logicalName?: string;
  physicalName?: string;
  dataType?: string;
  dataDetail?: string[];
  isNullable?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  isIncremental?: boolean;
  defaultValue?: string;
  comment?: string;
  columnOrder?: number;
}

// 컬럼 수정 응답 타입
export interface UpdateColumnResponse {
  columnKey: number;
  tableKey: number;
  logicalName: string;
  physicalName: string;
  dataType: string;
  dataDetail: string[] | null;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIncremental: boolean;
  defaultValue: string | null;
  comment: string;
  columnOrder: number;
  createdAt: string;
  updatedAt: string;
}



// export interface CreateColumnRequest {
//   logicalName: string;
//   physicalName: string;
//   dataType: string;
//   isPrimaryKey: boolean;
//   isIncremental: boolean;
// }

// 관계선 생성 요청 타입
export interface CreateRelationRequest {
  fromTableKey: number;
  fromColumnKey: number;
  toTableKey: number;
  relationType: string;
  constraintName: string;
  onDeleteAction: string;
  onUpdateAction: string;
}

// 관계선 생성 응답 타입
export interface CreateRelationResponse {
  relationKey: number;
  projectKey: number;
  fromTableKey: number;
  fromColumnKey: number;
  toTableKey: number;
  toColumnKey: number;
  relationType: string;
  constraintName: string;
  onDeleteAction: string;
  onUpdateAction: string;
  createdAt: string;
  updatedAt: string;
}
