import type {
  WorkspaceTable,
  WorkspaceTableColumn,
  WorkspaceRelation,
} from '../pages/workspace/WorkSpace';
import type {
  VersionTableData,
  VersionColumnData,
  VersionRelationData,
  RelationType,
  OnDeleteAction,
  OnUpdateAction,
} from '../types/version';

/**
 * dataType과 dataDetail을 파싱하여 API 형식으로 변환
 * 예: "VARCHAR(255)" -> dataType: "VARCHAR", dataDetail: [255]
 * 예: "DECIMAL(10,2)" -> dataType: "DECIMAL", dataDetail: [10, 2]
 */
function parseDataType(
  dataType: string,
  dataDetail?: string,
): { dataType: string; dataDetail: (string | number)[] } {
  // dataDetail이 이미 있으면 그것을 우선 사용
  if (dataDetail) {
    const match = dataDetail.match(/^([A-Z]+)\((.*?)\)$/i);
    if (match) {
      const type = match[1].toUpperCase();
      const details = match[2].split(',').map((d) => {
        const trimmed = d.trim();
        const num = Number(trimmed);
        return Number.isNaN(num) ? trimmed : num;
      });
      return { dataType: type, dataDetail: details };
    }
    // 괄호가 없는 경우 (예: "INT", "TEXT")
    return { dataType: dataDetail.toUpperCase(), dataDetail: [] };
  }

  // dataType만 있는 경우
  const match = dataType.match(/^([A-Z]+)\((.*?)\)$/i);
  if (match) {
    const type = match[1].toUpperCase();
    const details = match[2].split(',').map((d) => {
      const trimmed = d.trim();
      const num = Number(trimmed);
      return Number.isNaN(num) ? trimmed : num;
    });
    return { dataType: type, dataDetail: details };
  }

  // 괄호가 없는 경우
  return { dataType: dataType.toUpperCase(), dataDetail: [] };
}

/**
 * WorkspaceTableColumn을 VersionColumnData로 변환
 */
export function convertColumnToVersionFormat(
  column: WorkspaceTableColumn,
): VersionColumnData | null {
  // columnKey가 없으면 변환하지 않음 (백엔드에 아직 저장되지 않은 컬럼)
  if (!column.key) {
    console.warn('Column without key detected, skipping:', column);
    return null;
  }

  const { dataType, dataDetail } = parseDataType(
    column.dataType,
    column.dataDetail,
  );

  // allowNull이 "Y" 또는 "N"으로 저장되어 있는 경우
  const isNullable = column.allowNull === 'Y';

  // defaultValue 처리: 빈 문자열이면 null로
  const defaultValue =
    column.defaultValue && column.defaultValue.trim() !== ''
      ? column.defaultValue
      : null;

  return {
    columnKey: column.key,
    physicalName: column.physicalName,
    logicalName: column.logicalName,
    dataType,
    dataDetail,
    isPrimaryKey: column.isPK,
    isNullable,
    isUnique: column.isPK, // PK는 자동으로 unique
    isForeignKey: column.isFK,
    isIncremental: false, // 워크스페이스에는 이 정보가 없으므로 기본값
    defaultValue,
  };
}

/**
 * WorkspaceTable을 VersionTableData로 변환
 */
export function convertTableToVersionFormat(
  table: WorkspaceTable,
): VersionTableData | null {
  // tableKey가 없으면 변환하지 않음 (백엔드에 아직 저장되지 않은 테이블)
  if (!table.key) {
    console.warn('Table without key detected, skipping:', table);
    return null;
  }

  const convertedColumns = table.columns
    .map((col) => convertColumnToVersionFormat(col))
    .filter((col): col is VersionColumnData => col !== null);

  // 컬럼이 하나도 없으면 테이블을 저장하지 않음
  if (convertedColumns.length === 0) {
    console.warn('Table has no valid columns, skipping:', table);
    return null;
  }

  return {
    tableKey: table.key,
    physicalName: table.identifier,
    logicalName: table.name,
    columns: convertedColumns,
  };
}

/**
 * 카디널리티와 식별/비식별 관계를 RelationType으로 변환
 */
function convertToRelationType(
  cardinality: string,
  type: 'identifying' | 'non-identifying',
  sourceTableId: string,
  targetTableId: string,
  tables: WorkspaceTable[],
): RelationType {

  console.log(type)

  // sourceTable의 FK 컬럼이 nullable인지 확인
  const sourceTable = tables.find((t) => t.id === sourceTableId);
  const targetTable = tables.find((t) => t.id === targetTableId);

  // FK 컬럼 찾기 (targetTable의 PK를 참조하는 컬럼)
  const targetPKs = targetTable?.columns.filter((col) => col.isPK) || [];
  const sourceFKs =
    sourceTable?.columns.filter(
      (col) =>
        col.isFK &&
        targetPKs.some((pk) => pk.physicalName === col.physicalName),
    ) || [];

  const isNullable = sourceFKs.some((fk) => fk.allowNull === 'Y');

  // 카디널리티에 따라 RelationType 결정
  switch (cardinality) {
    case '1': // 1:1
    case '11':
      return 'ONE_TO_ONE';

    case '13': // 1:N
      return isNullable ? 'OPTIONAL_ONE_TO_MANY' : 'STRICT_ONE_TO_MANY';

    case '01': // 0,1:1
    case '01-1':
      return 'ONE_TO_ONE';

    case '013': // 0,1:N
      return 'OPTIONAL_ONE_TO_MANY';

    default:
      // 기본값: nullable이면 OPTIONAL, 아니면 STRICT
      return isNullable ? 'OPTIONAL_ONE_TO_MANY' : 'STRICT_ONE_TO_MANY';
  }
}

/**
 * RelationType과 nullable 여부에 따라 onDelete, onUpdate 액션 결정
 */
function determineConstraintActions(relationType: RelationType): {
  onDeleteAction: OnDeleteAction;
  onUpdateAction: OnUpdateAction;
} {
  switch (relationType) {
    case 'OPTIONAL_ONE_TO_MANY':
    case 'OPTIONAL_MANY_TO_ONE':
      return {
        onDeleteAction: 'SET NULL',
        onUpdateAction: 'CASCADE',
      };

    case 'STRICT_ONE_TO_MANY':
    case 'STRICT_MANY_TO_ONE':
      return {
        onDeleteAction: 'CASCADE',
        onUpdateAction: 'CASCADE',
      };

    case 'ONE_TO_ONE':
      return {
        onDeleteAction: 'CASCADE',
        onUpdateAction: 'CASCADE',
      };

    case 'MANY_TO_MANY':
      return {
        onDeleteAction: 'CASCADE',
        onUpdateAction: 'CASCADE',
      };

    default:
      return {
        onDeleteAction: 'CASCADE',
        onUpdateAction: 'CASCADE',
      };
  }
}

/**
 * WorkspaceRelation을 VersionRelationData로 변환
 */
export function convertRelationToVersionFormat(
  relation: WorkspaceRelation,
  tables: WorkspaceTable[],
): VersionRelationData | null {
  const sourceTable = tables.find((t) => t.id === relation.sourceTableId);
  const targetTable = tables.find((t) => t.id === relation.targetTableId);

  // 테이블 키가 없으면 변환하지 않음
  if (!sourceTable?.key || !targetTable?.key) {
    console.warn('Relation references table without key, skipping:', relation);
    return null;
  }

  const relationType = convertToRelationType(
    relation.cardinality,
    relation.type,
    relation.sourceTableId,
    relation.targetTableId,
    tables,
  );

  const { onDeleteAction, onUpdateAction } =
    determineConstraintActions(relationType);

  // constraintName 생성 (예: fk_posts_user)
  const constraintName = `fk_${sourceTable.identifier}_${targetTable.identifier}`;

  return {
    fromTableKey: sourceTable.key,
    toTableKey: targetTable.key,
    relationType,
    constraintName,
    onDeleteAction,
    onUpdateAction,
  };
}
