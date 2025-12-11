/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { toPng } from 'html-to-image';
import { useAuthStore } from '../../stores/authStore';
import {
  DEFAULT_NOTE_COLOR,
  TABLE_COLOR_HEX_MAP,
} from './constants/colorOptions';
import {
  createTable as createTableApi,
  getTables as getTablesApi,
  deleteTable as deleteTableApi,
  createColumn as createColumnApi,
  deleteColumn as deleteColumnApi,
  createRelation as createRelationApi,
} from '../../apis/tableApi';
import type { WorkspaceMode } from './WorkspaceCanvas';
import { useAiDraftStore } from '../../stores/aiDraftStore';
import { apiController } from '../../apis/apiController';

export type SidebarTool =
  | 'cursor'
  | 'multi-select'
  | 'hand'
  | 'add-table'
  | 'memo'
  | '013-relation'
  | '01-relation-1'
  | '01-relation'
  | '13-relation'
  | '11-relation'
  | '1-relation'
  | 'import'
  | 'export';

export type WorkspaceTableColumn = {
  id: string;
  key?: number; // 백엔드 columnKey
  isPK: boolean;
  isFK: boolean;
  logicalName: string;
  physicalName: string;
  dataType: string;
  dataDetail?: string;
  allowNull: string;
  defaultValue: string;
  comment: string;
};

export type WorkspaceTableColor =
  | 'blue'
  | 'user2'
  | 'user3'
  | 'user4'
  | 'user5'
  | 'user6'
  | 'user7'
  | 'user8';

export type WorkspaceNote = {
  id: string;
  x: number;
  y: number;
  content: string;
  color: WorkspaceTableColor;
};

export type RelationType = 'identifying' | 'non-identifying';

export type WorkspaceRelation = {
  id: string;
  sourceTableId: string;
  targetTableId: string;
  type: RelationType;
  cardinality: '1' | '11' | '13' | '01' | '01-1' | '013';
};

export type WorkspaceTable = {
  id: string;
  key?: number; // 백엔드 tableKey
  name: string;
  identifier: string;
  x: number;
  y: number;
  color: WorkspaceTableColor;
  columns: WorkspaceTableColumn[];
  isLocked?: boolean; // 다른 사용자가 편집 중인지 여부
  lockedBy?: { userEmail: string; userName: string }; // 락을 보유한 사용자 정보
};

export type WorkspaceSnapshot = {
  id: string;
  name: string;
  createdAt: number;
  tables: WorkspaceTable[];
  notes: WorkspaceNote[];
  relations: WorkspaceRelation[];
  pan: { x: number; y: number };
  zoom: number;
  previewDataUrl: string | null;
  createdBy: {
    id: string;
    name: string;
    avatarColor?: string;
  } | null;
};

interface WorkspaceContextValue {
  projectKey?: number;
  activeTool: SidebarTool;
  setActiveTool: (tool: SidebarTool) => void;
  tables: WorkspaceTable[];
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: Dispatch<SetStateAction<{ x: number; y: number }>>;
  replaceTables: (
    tables: WorkspaceTable[],
    options?: { resetView?: boolean },
  ) => void;
  createTable: (name: string) => void;
  addTableFromWebSocket: (table: WorkspaceTable) => void;
  updateTableFromWebSocket: (table: WorkspaceTable) => void;
  removeTableFromWebSocket: (tableKey: number) => void;
  addColumnFromWebSocket: (
    tableKey: number,
    column: WorkspaceTableColumn,
  ) => void;
  updateColumnFromWebSocket: (
    tableKey: number,
    column: WorkspaceTableColumn,
  ) => void;
  updateColumnByKeyFromWebSocket: (column: WorkspaceTableColumn) => void;
  removeColumnFromWebSocket: (columnKey: number) => void;
  duplicateTable: (tableId: string) => void;
  updateTableName: (tableId: string, name: string) => void;
  updateTableIdentifier: (tableId: string, identifier: string) => void;
  updateTableColor: (tableId: string, color: WorkspaceTableColor) => void;
  addKeyColumn: (tableId: string) => void;
  addColumn: (tableId: string) => void;
  updateTableColumn: (
    tableId: string,
    columnId: string,
    updates: Partial<WorkspaceTableColumn>,
  ) => void;
  reorderTableColumn: (
    tableId: string,
    columnId: string,
    targetIndex: number,
  ) => void;
  deleteTableColumn: (tableId: string, columnId: string) => void;
  updateTablePosition: (
    tableId: string,
    position: { x: number; y: number },
  ) => void;
  deleteTable: (tableId: string) => void;
  notes: WorkspaceNote[];
  createNote: (position: { x: number; y: number }) => WorkspaceNote;
  updateNote: (noteId: string, updates: Partial<WorkspaceNote>) => void;
  deleteNote: (noteId: string) => void;
  relations: WorkspaceRelation[];
  createRelation: (
    sourceTableId: string,
    targetTableId: string,
    type: RelationType,
    cardinality: WorkspaceRelation['cardinality'],
  ) => void;
  deleteRelation: (relationId: string) => void;
  addRelationFromWebSocket: (relation: WorkspaceRelation) => void;
  removeRelationFromWebSocket: (relationKey: number) => void;
  snapshots: WorkspaceSnapshot[];
  createSnapshot: (name?: string) => WorkspaceSnapshot | null;
  restoreSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
  registerWorkspaceCanvas: (element: HTMLDivElement | null) => void;
  // handleAiDraftConfirm: () => Promise<void>;
  // handleAiDraftConfirm: () => void;
  handleAiDraftCancel: () => void;
  lockTable: (tableId: string) => boolean;
  unlockTable: (tableId: string) => void;
  setTableLockState: (
    tableId: string,
    isLocked: boolean,
    lockedBy?: { userEmail: string; userName: string },
  ) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

const DEFAULT_IDENTIFIER = 'Untitled';

const cloneTables = (tables: WorkspaceTable[]): WorkspaceTable[] =>
  tables.map((table) => ({
    ...table,
    columns: table.columns.map((column) => ({ ...column })),
  }));

const cloneNotes = (notes: WorkspaceNote[]): WorkspaceNote[] =>
  notes.map((note) => ({
    ...note,
    color: note.color ?? DEFAULT_NOTE_COLOR,
  }));

/**
 * dataType과 길이/정밀도를 분리하는 함수
 * 예: "VARCHAR(255)" -> { dataType: "VARCHAR", dataDetail: "VARCHAR(255)" }
 * 예: "DECIMAL(10,2)" -> { dataType: "DECIMAL", dataDetail: "DECIMAL(10,2)" }
 * 예: "INTEGER" -> { dataType: "INTEGER", dataDetail: undefined }
 */
const parseDataTypeFromAi = (
  type: string,
): { dataType: string; dataDetail?: string } => {
  const match = type.match(/^([A-Z]+)(\(.*?\))?$/i);
  if (!match) {
    return { dataType: type.toUpperCase() };
  }

  const baseType = match[1].toUpperCase();
  const hasDetails = match[2] !== undefined;

  return {
    dataType: baseType,
    dataDetail: hasDetails ? type : undefined,
  };
};

/**
 * constraints 배열에서 DEFAULT 값을 추출하는 함수
 * 예: ["DEFAULT CURRENT_TIMESTAMP"] -> "CURRENT_TIMESTAMP"
 * 예: ["DEFAULT 0"] -> "0"
 */
const extractDefaultValue = (constraints: string[]): string => {
  const defaultConstraint = constraints.find((c) =>
    c.toUpperCase().startsWith('DEFAULT'),
  );
  if (!defaultConstraint) {
    return '';
  }

  return defaultConstraint
    .replace(/^DEFAULT\s+/i, '')
    .trim()
    .replace(/^['"]|['"]$/g, ''); // 따옴표 제거
};

// AI 초안 응답을 WorkspaceTable[]로 변환하는 함수
const parseAiDraftToTables = (generated_schema: {
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      constraints: string[];
    }>;
  }>;
}): WorkspaceTable[] => {
  if (!generated_schema?.tables) {
    return [];
  }

  return generated_schema.tables.map((table, index) => {
    const tableId = `table-${table.name}-${Date.now()}-${index}`;

    return {
      id: tableId,
      name: table.name,
      identifier: table.name,
      x: 200 + index * 280,
      y: 150 + (index % 2) * 220,
      color: [
        'blue',
        'user2',
        'user3',
        'user4',
        'user5',
        'user6',
        'user7',
        'user8',
      ][index % 8] as WorkspaceTableColor,
      columns: table.columns.map((col, colIndex) => {
        const isPrimaryKey = col.constraints?.includes('PRIMARY KEY') || false;
        const isForeignKey = col.constraints?.includes('FOREIGN KEY') || false;
        const isNotNull = col.constraints?.includes('NOT NULL') || false;
        const { dataType, dataDetail } = parseDataTypeFromAi(col.type);
        const defaultValue = extractDefaultValue(col.constraints || []);

        return {
          id: `column-${tableId}-${col.name}-${colIndex}`,
          isPK: isPrimaryKey,
          isFK: isForeignKey,
          logicalName: col.name,
          physicalName: col.name,
          dataType,
          dataDetail,
          allowNull: isNotNull ? 'N' : 'Y', // 🔥 수정: 'NOT NULL' -> 'N', 'NULL' -> 'Y'
          defaultValue,
          comment: '',
        };
      }),
    };
  });
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
  mode: WorkspaceMode;
  initialProjectKey?: number; // URL에서 넘어온 projectKey (있을 수도, 없을 수도 있음)
  // viewId?: string;           // 뷰어 모드일 때 넘어온 viewId
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  mode,
  initialProjectKey,
  // viewId
}) => {
  // Context 내에서 사용할 projectKey 상태. 초기값은 prop으로 받은 값.
  const projectKey = initialProjectKey;
  const isViewMode = mode === 'view';
  const [activeTool, setActiveToolState] = useState<SidebarTool>('cursor');
  const [tables, setTables] = useState<WorkspaceTable[]>([]);
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [relations, setRelations] = useState<WorkspaceRelation[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([]);
  const [workspaceCanvas, setWorkspaceCanvas] = useState<HTMLDivElement | null>(
    null,
  );
  const currentUser = useAuthStore((state) => state.currentUser);
  const {
    isAiAssistNeed,
    aiDraftData,
    clearAiDraftData,
    setAiDraftResult,
    setPreviewTables,
  } = useAiDraftStore();
  const [myLockedTables, setMyLockedTables] = useState<Set<number>>(new Set()); // 내가 락을 건 테이블들 (tableKey)
  const [isAiAssistLoading, setIsAiAssistLoading] = useState<boolean>(false);

  // ai 초안 생성 요청
  useEffect(() => {

    if (!isAiAssistNeed || isViewMode) return;

    setIsAiAssistLoading(true);

    const createERDDraftWithAi = async () => {
      setIsAiAssistLoading(true);
      console.log('ai 초안 생성 요청 보냄.', aiDraftData);
      try {
        const response = await apiController({
          url: '/api/v1/erd-generation',
          method: 'post',
          data: {
            projectName: aiDraftData?.projectName,
            projectDescription: aiDraftData?.projectDescription,
            userPrompt: aiDraftData?.userPrompt,
          },
          timeout: 5 * 60 * 1000, // 5분까지 기다려보자.
        });

        console.log('ai 초안 생성 성공.', response);

        const result = response.data.result;

        // 1. Store에 원본 데이터 저장
        setAiDraftResult(result);
        console.log('store에 저장한 데이터:', result);

        // 2. generated_schema를 WorkspaceTable[]로 변환
        const parsedTables = parseAiDraftToTables(result.generated_schema);

        console.log('파싱된 테이블:', parsedTables);

        // 3. relations 파싱
        type AiRelation = {
          fromTable: string;
          toTable: string;
          fromColumn: string;
          toColumn: string;
          type: string;
        };

        const parsedRelations: WorkspaceRelation[] = (
          result.generated_schema?.relations?.map(
            (rel: AiRelation, index: number): WorkspaceRelation | null => {
              // 테이블 이름으로 테이블 ID 찾기
              const sourceTable = parsedTables.find((t) => t.name === rel.fromTable);
              const targetTable = parsedTables.find((t) => t.name === rel.toTable);

              if (!sourceTable || !targetTable) {
                console.warn('관계선 테이블을 찾을 수 없음:', rel);
                return null;
              }

              // type에 따라 cardinality 결정
              // many_to_one -> 13 (1:N)
              // one_to_one -> 11 (1:1)
              // one_to_many -> 13 (1:N)
              const cardinalityMap: Record<string, WorkspaceRelation['cardinality']> = {
                many_to_one: '13',
                one_to_many: '13',
                one_to_one: '11',
                many_to_many: '13', // M:N은 일단 1:N으로 표시
              };

              return {
                id: `relation-ai-${Date.now()}-${index}`,
                sourceTableId: sourceTable.id,
                targetTableId: targetTable.id,
                type: 'non-identifying' as RelationType, // AI 응답에는 식별/비식별 정보가 없음
                cardinality: cardinalityMap[rel.type] || '13',
              };
            },
          ) || []
        ).filter(
          (rel: WorkspaceRelation | null): rel is WorkspaceRelation => rel !== null,
        );

        console.log('파싱된 관계선:', parsedRelations);

        // 4. 관계선도 함께 표시
        setRelations(parsedRelations);

        // 5. 미리보기로 캔버스에 표시
        replaceTables(parsedTables);

        // 6. Store에 미리보기 테이블 저장
        setPreviewTables(parsedTables);
        console.log('store에 저장된 테이블 임시 데이터:', parsedTables);

        // 5. aiDraftStore의 aiDraftResult 상태로 자동으로 컨펌 모달이 표시됨

        // 요청 데이터 초기화
        clearAiDraftData();

      } catch (err) {
        console.log('ai 초안 생성 실패:', err);
      } finally {
        setIsAiAssistLoading(false);
      }
    };

    createERDDraftWithAi();

  }, [
    aiDraftData,
    clearAiDraftData,
    isAiAssistNeed,
    isViewMode,
  ]);


  // 테이블 조회 API 호출
  useEffect(() => {

    if (isAiAssistNeed || isViewMode) return;

    const fetchTables = async () => {
      if (!projectKey) {
        console.error('프로젝트 키가 없습니다.');
        return;
      }

      try {
        const data = await getTablesApi(projectKey);
        console.log('테이블 조회 결과:', data);

        // 백엔드 데이터를 프론트엔드 형식으로 변환
        const convertedTables: WorkspaceTable[] = data.tables.map((table) => {
          // 해당 테이블의 컬럼들 찾기
          const tableColumns = data.columns
            .filter((col) => col.tableKey === table.tableKey)
            .map((col) => ({
              id: `column-${col.columnKey}`,
              key: col.columnKey,
              isPK: col.isPrimaryKey,
              isFK: col.isForeignKey,
              logicalName: col.logicalName || 'Logical Name',
              physicalName: col.physicalName || 'Physical Name',
              dataType: col.dataType || 'VARCHAR',
              allowNull: col.isNullable ? 'Y' : 'N',
              defaultValue: col.defaultValue || 'Default Value',
              comment: col.comment || 'Comment',
            }));

          // colorHex를 WorkspaceTableColor로 변환
          const getColorFromHex = (hex: string | null): WorkspaceTableColor => {
            if (!hex) return 'blue';
            const normalizedHex = hex.toUpperCase();
            const colorEntry = Object.entries(TABLE_COLOR_HEX_MAP).find(
              ([, value]) =>
                value.replace('#', '').toUpperCase() === normalizedHex,
            );
            return (colorEntry?.[0] as WorkspaceTableColor) || 'blue';
          };

          return {
            id: `table-${table.tableKey}`,
            key: table.tableKey,
            name: table.logicalName,
            identifier: table.physicalName,
            x: table.xposition,
            y: table.yposition,
            color: getColorFromHex(table.colorHex),
            columns: tableColumns,
          };
        });

        setTables(convertedTables);

        // 백엔드 관계선 데이터를 프론트엔드 형식으로 변환
        const convertedRelations: WorkspaceRelation[] = data.relations.map(
          (relation) => {
            // relationType을 cardinality로 변환
            const cardinalityMap: Record<
              string,
              '1' | '11' | '13' | '01' | '01-1' | '013'
            > = {
              STRICT_ONE_TO_ONE: '11',
              STRICT_ONE_TO_MANY: '13',
              OPTIONAL_ONE_TO_ONE: '01',
              OPTIONAL_ONE_TO_MANY: '013',
            };

            // constraintName으로 type 결정
            const type: RelationType =
              relation.constraintName === '식별'
                ? 'identifying'
                : 'non-identifying';

            return {
              id: `relation-${relation.relationKey}`,
              sourceTableId: `table-${relation.fromTableKey}`,
              targetTableId: `table-${relation.toTableKey}`,
              type,
              cardinality: cardinalityMap[relation.relationType] || '13',
            };
          },
        );

        setRelations(convertedRelations);
      } catch (error) {
        console.error('테이블 조회 실패:', error);
      }
    };

    fetchTables();
  }, []);


  const setActiveTool = useCallback((tool: SidebarTool) => {
    setActiveToolState(tool);
  }, []);


  const replaceTables = useCallback(
    (
      nextTables: WorkspaceTable[],
      options: { resetView?: boolean } = { resetView: true },
    ) => {
      const shouldReset = options.resetView ?? true;
      setTables(cloneTables(nextTables));
      if (shouldReset) {
        setNotes([]);
      }
      if (shouldReset) {
        setPan({ x: 0, y: 0 });
        setZoom(1);
      }
    },
    [],
  );

  // AI 초안 적용 핸들러 (백엔드와 상의 또는 웹 소켓 요청을 할 수 있도록 canvas로 이동하는 등 고민이 필요함.)
  // const handleAiDraftConfirm = useCallback(async () => {
  //   const previewTables = useAiDraftStore.getState().previewTables;

  //   if (!projectKey) {
  //     console.error('프로젝트 키가 없습니다.');
  //     return;
  //   }

  //   try {
  //     // 각 테이블을 순회하며 테이블 생성 및 컬럼 생성 처리
  //     for (const table of previewTables) {
  //       // 1. 테이블 생성
  //       const createdTable = await createTableApi({
  //         projectKey,
  //         logicalName: table.name,
  //         physicalName: table.identifier,
  //         xPosition: table.x,
  //         yPosition: table.y,
  //         colorHex: TABLE_COLOR_HEX_MAP[table.color].replace('#', '').toLowerCase(),
  //       });

  //       console.log(`테이블 생성 완료: ${table.name}, tableKey: ${createdTable.tableKey}`);

  //       // 2. 테이블 락 생성 (WebSocket)
  //       // TODO: wsClient가 필요한 경우 컨텍스트에 추가하여 사용
  //       // if (wsClient) {
  //       //   wsClient.sendTableLock(createdTable.tableKey);
  //       // }

  //       // 3. 각 테이블의 모든 컬럼에 대해 순회하며 컬럼 생성 요청
  //       const columnPromises = table.columns.map(async (column) => {
  //         // TODO: 컬럼 생성 API가 구현되면 여기에 추가
  //         // 현재는 컬럼 생성 API가 없으므로 로그만 출력
  //         console.log(`컬럼 생성 예정: ${column.logicalName} (${column.physicalName})`);

  //         // 예시: 향후 컬럼 생성 API 호출
  //         // await createColumnApi(
  //         //   createdTable.tableKey,
  //         //   {
  //         //     logicalName: column.logicalName,
  //         //     physicalName: column.physicalName,
  //         //     dataType: column.dataType,
  //         //     isPrimaryKey: column.isKey,
  //         //     isIncremental: column.isKey,  // 애매함.
  //         //   });
  //       });

  //       // 모든 컬럼 생성 Promise 완료 대기
  //       await Promise.all(columnPromises);

  //       console.log(`테이블 ${table.name}의 모든 컬럼 생성 완료`);

  //       // 4. 테이블 락 해제 (WebSocket)
  //       // TODO: wsClient가 필요한 경우 컨텍스트에 추가하여 사용
  //       // if (wsClient) {
  //       //   wsClient.sendTableUnlock(createdTable.tableKey);
  //       // }
  //     }

  //     console.log('AI 초안 테이블 및 컬럼 생성 완료');

  //     // 성공 시 정식 확정
  //     replaceTables(cloneTables(previewTables));

  //     // Store 초기화
  //     useAiDraftStore.getState().clearAiDraft();
  //   } catch (error) {
  //     console.error('AI 초안 테이블 생성 실패:', error);
  //     alert('테이블 생성에 실패했습니다. 다시 시도해주세요.');
  //   }
  // }, [projectKey, replaceTables]);


  // AI 초안 취소 핸들러
  const handleAiDraftCancel = useCallback(() => {
    // 캔버스 초기화 (빈 화면)
    replaceTables([]);

    // Store 초기화 (배너 닫힘)
    useAiDraftStore.getState().clearAiDraft();
  }, [replaceTables]);


  const createTable = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      // 기본 색상과 위치 계산
      const color: WorkspaceTableColor = 'blue';
      const xPosition = 200;
      const yPosition = 140;

      // 로컬에서 임시 테이블 생성 (즉시 UI 업데이트)
      const tempId = `table-${Date.now()}`;
      setTables((prev) => [
        ...prev,
        {
          id: tempId,
          name: trimmed,
          identifier: DEFAULT_IDENTIFIER,
          x: xPosition,
          y: yPosition,
          color,
          columns: [],
        },
      ]);

      // API 호출하여 서버에 테이블 생성
      try {
        if (!projectKey) {
          console.error('프로젝트 키가 없습니다.');
          return;
        }
        console.log('프로젝트키 :', projectKey);
        await createTableApi({
          projectKey,
          logicalName: trimmed,
          physicalName: 'untitled',
          xPosition,
          yPosition,
          colorHex: TABLE_COLOR_HEX_MAP[color].replace('#', '').toLowerCase(),
        });
      } catch (error) {
        console.error('테이블 생성 실패:', error);
        // 실패 시 로컬에서 생성한 테이블 제거
        setTables((prev) => prev.filter((table) => table.id !== tempId));
      }
    },
    [projectKey],
  );


  const addTableFromWebSocket = useCallback((table: WorkspaceTable) => {
    setTables((prev) => {
      // 이미 같은 tableKey를 가진 테이블이 있는지 확인
      const exists = prev.some((t) => t.key === table.key);
      if (exists) {
        console.log('테이블이 이미 존재합니다:', table.key);
        return prev;
      }
      return [...prev, table];
    });
  }, []);


  const updateTableFromWebSocket = useCallback((table: WorkspaceTable) => {
    setTables((prev) => {
      // key가 없는 임시 테이블을 찾아서 업데이트
      const tempTableIndex = prev.findIndex(
        (t) => !t.key && t.name === table.name,
      );
      if (tempTableIndex !== -1) {
        // 임시 테이블을 백엔드 데이터로 업데이트
        const updated = [...prev];
        updated[tempTableIndex] = {
          ...updated[tempTableIndex],
          ...table,
        };
        console.log('임시 테이블을 백엔드 데이터로 업데이트:', table.key);
        return updated;
      }
      // 임시 테이블을 찾지 못하면 그냥 추가
      console.log('임시 테이블을 찾지 못해 새로 추가:', table.key);
      return [...prev, table];
    });
  }, []);

  const removeTableFromWebSocket = useCallback((tableKey: number) => {
    setTables((prev) => {
      const filtered = prev.filter((t) => t.key !== tableKey);
      if (filtered.length === prev.length) {
        console.log('삭제할 테이블을 찾지 못함:', tableKey);
        return prev;
      }
      console.log('WebSocket으로 테이블 삭제:', tableKey);
      return filtered;
    });
  }, []);


  const addColumnFromWebSocket = useCallback(
    (tableKey: number, column: WorkspaceTableColumn) => {
      setTables((prev) =>
        prev.map((table) => {
          if (table.key !== tableKey) {
            return table;
          }
          const exists = table.columns.some((col) => col.key === column.key);
          if (exists) {
            console.log('컬럼이 이미 존재합니다:', column.key);
            return table;
          }
          console.log('WebSocket으로 컬럼 추가:', column.key);
          return {
            ...table,
            columns: [...table.columns, column],
          };
        }),
      );
    },
    [],
  );


  const updateColumnFromWebSocket = useCallback(
    (tableKey: number, column: WorkspaceTableColumn) => {
      setTables((prev) =>
        prev.map((table) => {
          if (table.key !== tableKey) {
            return table;
          }

          // 1. columnKey로 기존 컬럼 찾기 (다른 사용자가 수정한 경우)
          if (column.key) {
            const existingColumnIndex = table.columns.findIndex(
              (col) => col.key === column.key,
            );
            if (existingColumnIndex !== -1) {
              const updatedColumns = [...table.columns];
              updatedColumns[existingColumnIndex] = column;
              console.log('기존 컬럼을 WebSocket으로 업데이트:', column.key);
              return {
                ...table,
                columns: updatedColumns,
              };
            }
          }

          // 2. 임시 컬럼 찾기 (내가 생성한 컬럼에 key 할당)
          const tempColumnIndex = table.columns.findIndex(
            (col) => !col.key && col.logicalName === column.logicalName,
          );
          if (tempColumnIndex !== -1) {
            const updatedColumns = [...table.columns];
            updatedColumns[tempColumnIndex] = column;
            console.log('임시 컬럼을 백엔드 데이터로 업데이트:', column.key);
            return {
              ...table,
              columns: updatedColumns,
            };
          }

          console.log('컬럼을 찾지 못해 새로 추가:', column.key);
          return {
            ...table,
            columns: [...table.columns, column],
          };
        }),
      );
    },
    [],
  );


  const removeColumnFromWebSocket = useCallback((columnKey: number) => {
    setTables((prev) =>
      prev.map((table) => {
        const columnExists = table.columns.some((col) => col.key === columnKey);
        if (!columnExists) {
          return table;
        }
        console.log('WebSocket으로 컬럼 삭제:', columnKey);
        return {
          ...table,
          columns: table.columns.filter((col) => col.key !== columnKey),
        };
      }),
    );
  }, []);


  // columnKey만으로 컬럼 업데이트 (tableKey 없이)
  const updateColumnByKeyFromWebSocket = useCallback(
    (column: WorkspaceTableColumn) => {
      if (!column.key) {
        console.warn('columnKey가 없어서 업데이트할 수 없습니다.');
        return;
      }

      setTables((prev) =>
        prev.map((table) => {
          const columnIndex = table.columns.findIndex(
            (col) => col.key === column.key,
          );
          if (columnIndex === -1) {
            return table;
          }

          const updatedColumns = [...table.columns];
          updatedColumns[columnIndex] = column;
          console.log('WebSocket으로 컬럼 업데이트 (columnKey만):', column.key);
          return {
            ...table,
            columns: updatedColumns,
          };
        }),
      );
    },
    [],
  );


  const duplicateTable = useCallback((tableId: string) => {
    setTables((prev) => {
      const source = prev.find((table) => table.id === tableId);
      if (!source) {
        return prev;
      }

      const timestamp = Date.now();
      const newTableId = `table-${timestamp}-${Math.random()}`;
      const duplicatedColumns = source.columns.map((column, index) => ({
        ...column,
        id: `column-${timestamp}-${index}-${Math.random()}`,
      }));

      return [
        ...prev,
        {
          ...source,
          id: newTableId,
          name: `Copy of ${source.name}`,
          x: source.x + 32,
          y: source.y + 32,
          columns: duplicatedColumns,
        },
      ];
    });
  }, []);


  const updateTableName = useCallback((tableId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? {
            ...table,
            name: trimmed,
          }
          : table,
      ),
    );
  }, []);


  const updateTableIdentifier = useCallback(
    (tableId: string, identifier: string) => {
      const trimmed = identifier.trim() || DEFAULT_IDENTIFIER;

      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
              ...table,
              identifier: trimmed,
            }
            : table,
        ),
      );
    },
    [],
  );


  const addKeyColumn = useCallback(
    async (tableId: string) => {
      // 테이블 찾기
      const table = tables.find((t) => t.id === tableId);
      if (!table) {
        console.error('테이블을 찾을 수 없습니다:', tableId);
        return;
      }

      // 임시 컬럼 ID
      const tempColumnId = `column-${Date.now() + Math.random()}`;

      // 로컬에서 임시 컬럼 생성 (즉시 UI 업데이트)
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
              ...t,
              columns: [
                ...t.columns,
                {
                  id: tempColumnId,
                  isPK: true,
                  isFK: false,
                  logicalName: 'Logical Name',
                  physicalName: 'Physical Name',
                  dataType: 'VARCHAR',
                  allowNull: 'Y',
                  defaultValue: '',
                  comment: '',
                },
              ],
            }
            : t,
        ),
      );

      // 테이블에 백엔드 key가 있으면 API 호출
      if (table.key) {
        try {
          await createColumnApi(table.key, {
            isPrimaryKey: true,
            isForeignKey: false,
          });
          console.log('PK 컬럼 생성 API 호출 성공');
        } catch (error) {
          console.error('PK 컬럼 생성 실패:', error);
          // 실패 시 로컬에서 생성한 컬럼 제거
          setTables((prev) =>
            prev.map((t) =>
              t.id === tableId
                ? {
                  ...t,
                  columns: t.columns.filter((col) => col.id !== tempColumnId),
                }
                : t,
            ),
          );
        }
      }
    },
    [tables],
  );


  const updateTableColumn = useCallback(
    (
      tableId: string,
      columnId: string,
      updates: Partial<WorkspaceTableColumn>,
    ) => {
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
              ...table,
              columns: table.columns.map((column) =>
                column.id === columnId
                  ? {
                    ...column,
                    ...updates,
                  }
                  : column,
              ),
            }
            : table,
        ),
      );
    },
    [],
  );
  // 컬럼 추가
  const addColumn = useCallback(
    async (tableId: string) => {
      // 테이블 찾기
      const table = tables.find((t) => t.id === tableId);
      if (!table) {
        console.error('테이블을 찾을 수 없습니다:', tableId);
        return;
      }

      // 임시 컬럼 ID
      const tempColumnId = `column-${Date.now() + Math.random()}`;

      // 로컬에서 임시 컬럼 생성 (즉시 UI 업데이트)
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? {
              ...t,
              columns: [
                ...t.columns,
                {
                  id: tempColumnId,
                  isPK: false,
                  isFK: false,
                  logicalName: 'Logical Name',
                  physicalName: 'Physical Name',
                  dataType: 'VARCHAR',
                  allowNull: 'Y',
                  defaultValue: '',
                  comment: '',
                },
              ],
            }
            : t,
        ),
      );


      // 테이블에 백엔드 key가 있으면 API 호출
      if (table.key) {
        try {
          await createColumnApi(table.key, {
            isPrimaryKey: false,
            isForeignKey: false,
          });
          console.log('컬럼 생성 API 호출 성공');
        } catch (error) {
          console.error('컬럼 생성 실패:', error);
          // 실패 시 로컬에서 생성한 컬럼 제거
          setTables((prev) =>
            prev.map((t) =>
              t.id === tableId
                ? {
                  ...t,
                  columns: t.columns.filter((col) => col.id !== tempColumnId),
                }
                : t,
            ),
          );
        }
      }
    },
    [tables],
  );


  const updateTableColor = useCallback(
    (tableId: string, color: WorkspaceTableColor) => {
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
              ...table,
              color,
            }
            : table,
        ),
      );
    },
    [],
  );


  const reorderTableColumn = useCallback(
    (tableId: string, columnId: string, targetIndex: number) => {
      setTables((prev) =>
        prev.map((table) => {
          if (table.id !== tableId) {
            return table;
          }

          const currentIndex = table.columns.findIndex(
            (column) => column.id === columnId,
          );
          if (currentIndex === -1 || table.columns.length <= 1) {
            return table;
          }

          const nextColumns = [...table.columns];
          const [movingColumn] = nextColumns.splice(currentIndex, 1);
          if (!movingColumn) {
            return table;
          }

          const clampedTarget = Math.max(
            0,
            Math.min(targetIndex, nextColumns.length),
          );
          nextColumns.splice(clampedTarget, 0, movingColumn);

          return {
            ...table,
            columns: nextColumns,
          };
        }),
      );
    },
    [],
  );


  const deleteTableColumn = useCallback(
    async (tableId: string, columnId: string) => {
      // columnKey를 먼저 찾기
      let columnKey: number | undefined;

      setTables((prev) => {
        const table = prev.find((t) => t.id === tableId);
        if (table) {
          const column = table.columns.find((c) => c.id === columnId);
          columnKey = column?.key;
        }

        return prev.map((table) =>
          table.id === tableId
            ? {
              ...table,
              columns: table.columns.filter(
                (column) => column.id !== columnId,
              ),
            }
            : table,
        );
      });

      // API 호출
      if (columnKey) {
        try {
          await deleteColumnApi(columnKey);
        } catch (error) {
          console.error('컬럼 삭제 API 호출 실패:', error);
        }
      }
    },
    [],
  );


  const updateTablePosition = useCallback(
    (tableId: string, position: { x: number; y: number }) => {
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
              ...table,
              x: position.x,
              y: position.y,
            }
            : table,
        ),
      );
    },
    [],
  );


  // 테이블 삭제
  const deleteTable = useCallback(async (tableId: string) => {
    // setTables의 함수형 업데이트를 사용하여 table 찾기
    let tableKey: number | undefined;

    setTables((prev) => {
      const table = prev.find((t) => t.id === tableId);
      tableKey = table?.key;
      return prev.filter((table) => table.id !== tableId);
    });

    // API 호출
    if (tableKey) {
      try {
        await deleteTableApi(tableKey);
        console.log('테이블 삭제 성공:', tableKey);
      } catch (error) {
        console.error('테이블 삭제 실패:', error);
      }
    }
  }, []);


  const createNote = useCallback((position: { x: number; y: number }) => {
    const note: WorkspaceNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x: position.x,
      y: position.y,
      content: '',
      color: DEFAULT_NOTE_COLOR,
    };
    setNotes((prev) => [...prev, note]);
    return note;
  }, []);

  const updateNote = useCallback(
    (noteId: string, updates: Partial<WorkspaceNote>) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
              ...note,
              ...updates,
            }
            : note,
        ),
      );
    },
    [],
  );


  const deleteNote = useCallback((noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  }, []);


  const createRelation = useCallback(
    async (
      sourceTableId: string,
      targetTableId: string,
      type: RelationType,
      cardinality: WorkspaceRelation['cardinality'],
    ) => {
      // 프론트엔드 로컬 상태 업데이트
      const newRelation: WorkspaceRelation = {
        id: `relation-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        sourceTableId,
        targetTableId,
        type,
        cardinality,
      };
      setRelations((prev) => [...prev, newRelation]);

      // API 호출
      if (!projectKey) {
        console.error('projectKey가 없습니다.');
        return;
      }

      // sourceTable에서 PK 컬럼 찾기
      const sourceTable = tables.find((t) => t.id === sourceTableId);
      const targetTable = tables.find((t) => t.id === targetTableId);

      if (!sourceTable?.key || !targetTable?.key) {
        console.error('테이블 key가 없습니다.');
        return;
      }

      // PK 컬럼 찾기 (isPK가 true인 컬럼)
      const pkColumn = sourceTable.columns.find((col) => col.isPK);
      if (!pkColumn?.key) {
        console.error('PK 컬럼을 찾을 수 없습니다.');
        return;
      }

      // cardinality를 relationType으로 변환
      const relationTypeMap: Record<string, string> = {
        '1': 'STRICT_ONE_TO_ONE',
        '11': 'STRICT_ONE_TO_ONE',
        '13': 'STRICT_ONE_TO_MANY',
        '01': 'OPTIONAL_ONE_TO_ONE',
        '01-1': 'OPTIONAL_ONE_TO_ONE',
        '013': 'OPTIONAL_ONE_TO_MANY',
      };

      const relationType = relationTypeMap[cardinality] || 'STRICT_ONE_TO_MANY';
      const constraintName = type === 'identifying' ? '식별' : '비식별';

      try {
        await createRelationApi(projectKey, {
          fromTableKey: sourceTable.key,
          fromColumnKey: pkColumn.key,
          toTableKey: targetTable.key,
          relationType,
          constraintName,
          onDeleteAction: 'NO_ACTION',
          onUpdateAction: 'NO_ACTION',
        });
      } catch (error) {
        console.error('관계선 생성 API 호출 실패:', error);
      }
    },
    [projectKey, tables],
  );


  const deleteRelation = useCallback((relationId: string) => {
    setRelations((prev) =>
      prev.filter((relation) => relation.id !== relationId),
    );
  }, []);


  // WebSocket으로 관계선 추가
  const addRelationFromWebSocket = useCallback(
    (relation: WorkspaceRelation) => {
      setRelations((prev) => {
        // 이미 존재하는 관계선인지 확인
        const exists = prev.some((r) => r.id === relation.id);
        if (exists) {
          return prev;
        }
        return [...prev, relation];
      });
    },
    [],
  );


  // WebSocket으로 관계선 삭제
  const removeRelationFromWebSocket = useCallback((relationKey: number) => {
    setRelations((prev) =>
      prev.filter((relation) => relation.id !== `relation-${relationKey}`),
    );
  }, []);


  const createSnapshot = useCallback(
    (name?: string) => {
      const trimmedName = name?.trim();
      const snapshotId = `snapshot-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      const snapshot: WorkspaceSnapshot = {
        id: snapshotId,
        name:
          trimmedName && trimmedName.length > 0
            ? trimmedName
            : `스냅샷 ${snapshots.length + 1}`,
        createdAt: Date.now(),
        tables: cloneTables(tables),
        notes: cloneNotes(notes),
        relations: relations.map((relation) => ({ ...relation })),
        pan: { ...pan },
        zoom,
        previewDataUrl: null,
        createdBy: currentUser
          ? {
            id: currentUser.userKey.toString(),
            name: currentUser.nickname,
            avatarColor: currentUser.avatarColor,
          }
          : null,
      };
      setSnapshots((prev) => [snapshot, ...prev]);
      const canvasElement = workspaceCanvas;
      if (canvasElement) {
        window.setTimeout(() => {
          toPng(canvasElement, {
            cacheBust: true,
            pixelRatio: window.devicePixelRatio ?? 1,
          })
            .then((dataUrl: string) => {
              setSnapshots((prev: WorkspaceSnapshot[]) => {
                const typedPrev: WorkspaceSnapshot[] = prev;
                for (let index = 0; index < typedPrev.length; index += 1) {
                  const item: WorkspaceSnapshot = typedPrev[index];
                  if (item.id === snapshotId) {
                    const next = [...typedPrev];
                    next[index] = {
                      ...item,
                      previewDataUrl: dataUrl,
                    };
                    return next;
                  }
                }
                return typedPrev;
              });
            })
            .catch((error: unknown) => {
              console.error('스냅샷 미리보기 생성 실패', error);
            });
        }, 0);
      }
      return snapshot;
    },
    [
      currentUser,
      notes,
      pan,
      snapshots.length,
      tables,
      workspaceCanvas,
      zoom,
      relations,
    ],
  );


  const restoreSnapshot = useCallback(
    (snapshotId: string) => {
      const snapshot = snapshots.find((item) => item.id === snapshotId);
      if (!snapshot) {
        return;
      }
      setTables(cloneTables(snapshot.tables));
      setNotes(cloneNotes(snapshot.notes));
      setRelations(snapshot.relations.map((relation) => ({ ...relation })));
      setPan({ ...snapshot.pan });
      setZoom(snapshot.zoom);
    },
    [snapshots],
  );


  const deleteSnapshot = useCallback((snapshotId: string) => {
    setSnapshots((prev) =>
      prev.filter((snapshot) => snapshot.id !== snapshotId),
    );
  }, []);

  const registerWorkspaceCanvas = useCallback(
    (element: HTMLDivElement | null) => {
      setWorkspaceCanvas(element);
    },
    [],
  );


  const lockTable = useCallback(
    (tableId: string): boolean => {
      const table = tables.find((t) => t.id === tableId);
      if (!table || !table.key) {
        return false;
      }

      // 이미 다른 사람이 락을 보유하고 있으면 실패
      if (table.isLocked) {
        console.warn(`테이블이 이미 잠겨있습니다: ${table.name}`);
        return false;
      }

      // 내가 락을 건 테이블 목록에 추가
      setMyLockedTables((prev) => new Set(prev).add(table.key!));

      return true;
    },
    [tables],
  );


  const unlockTable = useCallback(
    (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (table?.key) {
        // 내가 락을 건 테이블 목록에서 제거
        setMyLockedTables((prev) => {
          const next = new Set(prev);
          next.delete(table.key!);
          return next;
        });
      }

      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
              ...table,
              isLocked: false,
              lockedBy: undefined,
            }
            : table,
        ),
      );
    },
    [tables],
  );


  const setTableLockState = useCallback(
    (
      tableId: string,
      isLocked: boolean,
      lockedBy?: { userEmail: string; userName: string },
    ) => {
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
              ...table,
              isLocked,
              lockedBy,
            }
            : table,
        ),
      );
    },
    [],
  );


  // 하트비트 타이머: 10초마다 락을 유지하기 위한 신호 전송
  useEffect(() => {
    if (myLockedTables.size === 0 || !currentUser?.userKey) {
      return;
    }

    const userEmail = currentUser.userKey;

    const sendHeartbeat = async () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      for (const tableKey of myLockedTables) {
        try {
          await fetch(
            `${API_BASE_URL}/api/v1/heartbeat/${tableKey}?email=${encodeURIComponent(
              userEmail,
            )}`,
            {
              method: 'POST',
              credentials: 'include',
            },
          );
          console.log(`💓 Heartbeat sent for table ${tableKey}`);
        } catch (error) {
          console.error(`❌ Heartbeat failed for table ${tableKey}:`, error);
        }
      }
    };


    // 즉시 한 번 전송
    sendHeartbeat();

    // 10초마다 전송
    const intervalId = setInterval(sendHeartbeat, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [myLockedTables, currentUser?.email]);


  const value = useMemo(
    () => ({
      projectKey,
      activeTool,
      setActiveTool,
      tables,
      zoom,
      setZoom,
      pan,
      setPan,
      replaceTables,
      createTable,
      addTableFromWebSocket,
      updateTableFromWebSocket,
      removeTableFromWebSocket,
      addColumnFromWebSocket,
      updateColumnFromWebSocket,
      updateColumnByKeyFromWebSocket,
      removeColumnFromWebSocket,
      duplicateTable,
      updateTableName,
      updateTableIdentifier,
      updateTableColor,
      addKeyColumn,
      addColumn,
      updateTableColumn,
      reorderTableColumn,
      deleteTableColumn,
      updateTablePosition,
      deleteTable,
      notes,
      createNote,
      updateNote,
      deleteNote,
      relations,
      createRelation,
      deleteRelation,
      addRelationFromWebSocket,
      removeRelationFromWebSocket,
      snapshots,
      createSnapshot,
      restoreSnapshot,
      deleteSnapshot,
      registerWorkspaceCanvas,
      // handleAiDraftConfirm,
      handleAiDraftCancel,
      lockTable,
      unlockTable,
      setTableLockState,
    }),
    [
      projectKey,
      activeTool,
      setActiveTool,
      tables,
      zoom,
      setZoom,
      pan,
      setPan,
      replaceTables,
      createTable,
      addTableFromWebSocket,
      updateTableFromWebSocket,
      removeTableFromWebSocket,
      addColumnFromWebSocket,
      updateColumnFromWebSocket,
      updateColumnByKeyFromWebSocket,
      removeColumnFromWebSocket,
      duplicateTable,
      // handleAiDraftConfirm,
      handleAiDraftCancel,
      updateTableName,
      updateTableIdentifier,
      updateTableColor,
      addKeyColumn,
      addColumn,
      updateTableColumn,
      reorderTableColumn,
      deleteTableColumn,
      updateTablePosition,
      deleteTable,
      notes,
      createNote,
      updateNote,
      deleteNote,
      relations,
      createRelation,
      deleteRelation,
      addRelationFromWebSocket,
      removeRelationFromWebSocket,
      snapshots,
      createSnapshot,
      restoreSnapshot,
      deleteSnapshot,
      registerWorkspaceCanvas,
      lockTable,
      unlockTable,
      setTableLockState,
    ],
  );


  return (
    <>
      {/* gif */}
      {isAiAssistLoading ? (
        <div className="w-full h-dvh flex flex-col justify-center items-center gap-6 bg-[#F9F9FB]">
          <img
            src="/ani-final.gif"
            alt="Loading..."
            className="w-28 h-28 object-cover"
          />
          <div className="font-pretendard text-xl font-semibold text-my-black">
            AI의 초안이 도착할 때까지 기다리는 중...
          </div>
        </div>
      ) : (
        <WorkspaceContext.Provider value={value}>
          {children}
        </WorkspaceContext.Provider>
      )}
    </>
  );
};

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
