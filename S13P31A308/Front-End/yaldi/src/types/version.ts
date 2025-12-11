// 버전 저장 API 요청/응답 타입 정의

export type RelationType =
  | 'OPTIONAL_ONE_TO_MANY'
  | 'STRICT_ONE_TO_MANY'
  | 'OPTIONAL_MANY_TO_ONE'
  | 'STRICT_MANY_TO_ONE'
  | 'ONE_TO_ONE'
  | 'MANY_TO_MANY';

export type OnDeleteAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
export type OnUpdateAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export interface VersionColumnData {
  columnKey: number;
  physicalName: string;
  logicalName: string;
  dataType: string;
  dataDetail: (string | number)[];
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  isIncremental: boolean;
  defaultValue: string | null;
}

export interface VersionTableData {
  tableKey: number;
  physicalName: string;
  logicalName: string;
  columns: VersionColumnData[];
}

export interface VersionRelationData {
  fromTableKey: number;
  toTableKey: number;
  relationType: RelationType;
  constraintName: string;
  onDeleteAction: OnDeleteAction;
  onUpdateAction: OnUpdateAction;
}

export interface VersionSchemaData {
  tables: VersionTableData[];
  relations: VersionRelationData[];
}

export interface CreateVersionRequest {
  name: string;
  description?: string;
  schemaData: VersionSchemaData;
  isPublic: boolean;
}
