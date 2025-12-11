import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AddKeyIcon from '../../assets/icons/add_key_icon.svg?react';
import PlusIcon from '../../assets/icons/plus_icon.svg?react';
import PalatteIcon from '../../assets/icons/palatte_icon.svg?react';
import DeleteIcon from '../../assets/icons/delete_icon.svg?react';
import CopyIcon from '../../assets/icons/copy_icon.svg?react';
import MemoIcon from '../../assets/icons/memo_icon.svg?react';
import MiniMap from './rightsidebar/MiniMap';
import { useWorkspace, type SidebarTool } from './WorkSpace';
import TableCard from './components/TableCard';
import type {
  TableActionButton,
  TableComment,
  TableReply,
} from '../../types/tableCard';
import { useDtoSelectionStore } from '../../stores/dtoSelectionStore';
import { useEntitySelectionStore } from '../../stores/entitySelectionStore';
import NoteCard from './components/NoteCard';
import RelationLine from './components/RelationLine';
import RelationTypeModal from './components/RelationTypeModal';
import type { RelationType } from './WorkSpace';
import type { ErdWebSocketClient } from '../../services/websocket';
import { TableDragHandler } from '../../services/websocket/handlers/TableDragHandler';
import { updateColumn as updateColumnApi } from '../../apis/tableApi';

const MULTI_SELECT_TOOL: SidebarTool = 'multi-select';

const DEFAULT_NOTE_WIDTH = 200;
const DEFAULT_NOTE_HEIGHT = 160;

export type WorkspaceMode = 'edit' | 'view';

interface WorkspaceCanvasProps {
  mode?: WorkspaceMode;
  wsClient?: ErdWebSocketClient | null;
  currentUserKey?: number;
}

const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({
  mode = 'edit',
  wsClient = null,
  currentUserKey = 0,
}) => {
  const workspace = useWorkspace();
  const isViewMode = mode === 'view';
  const activeTool = workspace.activeTool as string;
  const {
    setActiveTool,
    tables,
    notes,
    relations,
    zoom,
    setZoom,
    pan,
    setPan,
    createTable,
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
    createNote,
    updateNote,
    deleteNote,
    createRelation,
    deleteRelation,
    registerWorkspaceCanvas,
    lockTable,
    unlockTable,
  } = workspace;
  const CANVAS_SIZE = 5000;
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 2;
  const [tableName, setTableName] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const previousSelectedTableIdsRef = useRef<string[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const isDtoSelecting = useDtoSelectionStore((state) => state.isSelecting);
  const isEntitySelecting = useEntitySelectionStore(
    (state) => state.isSelecting,
  );
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{
    tables: string[];
    pointerStart: { worldX: number; worldY: number };
    startPositions: Partial<Record<string, { x: number; y: number }>>;
    currentPositions: Partial<Record<string, { x: number; y: number }>>;
  } | null>(null);
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const panDragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const panMovedRef = useRef(false);
  const [selectionRect, setSelectionRect] = useState<{
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);
  const [activeCommentTableId, setActiveCommentTableId] = useState<
    string | null
  >(null);
  const [tableComments, setTableComments] = useState<
    Record<string, TableComment[]>
  >({});
  const [resolvedCommentTables, setResolvedCommentTables] = useState<
    Record<string, boolean>
  >({});

  // 관계선 그리기 관련 상태
  const [isRelationTypeModalOpen, setIsRelationTypeModalOpen] = useState(false);
  const [relationDrawingState, setRelationDrawingState] = useState<{
    sourceTableId: string | null;
    selectedType: RelationType | null;
  }>({
    sourceTableId: null,
    selectedType: null,
  });

  // TableDragHandler 초기화 (다른 사용자의 테이블 이동 수신용)
  const dragHandlerRef = useRef<TableDragHandler | null>(null);

  useEffect(() => {
    if (!wsClient || !currentUserKey || isViewMode) {
      return;
    }

    // 다른 사용자의 테이블 이동을 수신하기 위한 핸들러
    dragHandlerRef.current = new TableDragHandler(wsClient, {
      currentUserKey,
      onLocalUpdate: (tableKey, position) => {
        // 로컬 업데이트는 이미 dragState로 처리
        console.log('📍 Local update:', tableKey, position);
      },
      onRemoteUpdate: (tableKey, position, userKey) => {
        // 다른 사용자의 테이블 이동 수신
        console.log(
          '📥 Remote update:',
          tableKey,
          position,
          'from user:',
          userKey,
        );
        updateTablePosition(`table-${tableKey}`, position);
      },
    });

    console.log('✅ TableDragHandler initialized for receiving remote updates');

    return () => {
      dragHandlerRef.current = null;
    };
  }, [wsClient, currentUserKey, isViewMode, updateTablePosition]);

  const updateSelectionByRect = useCallback(
    (rect: {
      start: { x: number; y: number };
      current: { x: number; y: number };
    }) => {
      if (isViewMode || !canvasRef.current) {
        return;
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const left = Math.min(rect.start.x, rect.current.x);
      const top = Math.min(rect.start.y, rect.current.y);
      const right = Math.max(rect.start.x, rect.current.x);
      const bottom = Math.max(rect.start.y, rect.current.y);

      const selectedSet = new Set<string>();
      tables.forEach((table) => {
        const element = canvasRef.current?.querySelector<HTMLElement>(
          `[data-table-id="${table.id}"]`,
        );
        if (!element) {
          return;
        }
        const tableRect = element.getBoundingClientRect();
        const tableLeft = tableRect.left - canvasRect.left;
        const tableTop = tableRect.top - canvasRect.top;
        const tableRight = tableLeft + tableRect.width;
        const tableBottom = tableTop + tableRect.height;

        const intersects =
          tableRight >= left &&
          tableLeft <= right &&
          tableBottom >= top &&
          tableTop <= bottom;

        if (intersects) {
          selectedSet.add(table.id);
        }
      });

      const nextSelected = tables
        .filter((table) => selectedSet.has(table.id))
        .map((table) => table.id);

      setSelectedTableIds((prev) => {
        if (prev.length === nextSelected.length) {
          const isSame = prev.every((id, index) => id === nextSelected[index]);
          if (isSame) {
            return prev;
          }
        }
        return nextSelected;
      });
    },
    [tables, isViewMode],
  );

  useEffect(() => {
    if (activeTool === MULTI_SELECT_TOOL || selectedTableIds.length <= 1) {
      return;
    }
    setSelectedTableIds((prev) => {
      if (activeTool === MULTI_SELECT_TOOL || prev.length <= 1) {
        return prev;
      }
      const lastSelected = prev[prev.length - 1];
      return lastSelected ? [lastSelected] : [];
    });
  }, [activeTool, selectedTableIds.length]);

  // 테이블 선택이 변경될 때 이전에 선택된 테이블의 락 해제
  useEffect(() => {
    // 뷰어 모드에서는 락 처리 불필요
    if (isViewMode) {
      return;
    }

    const previousIds = previousSelectedTableIdsRef.current;
    const currentIds = selectedTableIds;

    // 이전에 선택되었지만 현재는 선택되지 않은 테이블들의 락 해제
    const deselectedTableIds = previousIds.filter(
      (id) => !currentIds.includes(id),
    );

    deselectedTableIds.forEach((tableId) => {
      const table = tables.find((t) => t.id === tableId);
      if (table && table.key) {
        console.log('🔓 테이블 선택 해제로 락 해제:', {
          tableId,
          tableKey: table.key,
          tableName: table.name,
        });
        unlockTable(tableId);
        if (wsClient) {
          wsClient.sendTableUnlock(table.key);
        }
      }
    });

    // 현재 선택된 테이블 ID를 저장
    previousSelectedTableIdsRef.current = currentIds;
  }, [selectedTableIds, tables, unlockTable, wsClient, isViewMode]);

  useEffect(() => {
    registerWorkspaceCanvas(canvasRef.current);
    return () => {
      registerWorkspaceCanvas(null);
    };
  }, [registerWorkspaceCanvas]);

  useEffect(() => {
    if (activeTool === 'add-table') {
      setIsInputVisible(true);
    } else {
      setIsInputVisible(false);
      setTableName('');
    }
  }, [activeTool]);

  useEffect(() => {
    if (!isInputVisible) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isInputVisible]);

  useEffect(() => {
    if (!selectionRect) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current) {
        return;
      }
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const localX = event.clientX - canvasRect.left;
      const localY = event.clientY - canvasRect.top;
      setSelectionRect((prev) => {
        if (!prev) {
          return prev;
        }
        const next = {
          ...prev,
          current: { x: localX, y: localY },
        };
        updateSelectionByRect(next);
        return next;
      });
    };

    const handleMouseUp = () => {
      setSelectionRect((prev) => {
        if (prev) {
          updateSelectionByRect(prev);
        }
        return null;
      });
    };

    if (isViewMode) {
      return;
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = previousUserSelect;
    };
  }, [selectionRect, updateSelectionByRect, isViewMode]);

  useEffect(() => {
    if (activeTool !== MULTI_SELECT_TOOL && selectionRect) {
      setSelectionRect(null);
    }
  }, [activeTool, selectionRect]);

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (panMovedRef.current) {
        panMovedRef.current = false;
        return;
      }

      // 뷰어 모드에서는 메모 추가 불가
      if (isViewMode) {
        return;
      }

      if (activeTool === 'memo') {
        const target = event.target as HTMLElement;
        if (target.closest('[data-note-id]')) {
          return;
        }
        const canvasElement = canvasRef.current;
        if (!canvasElement) {
          return;
        }
        const canvasRect = canvasElement.getBoundingClientRect();
        const pointerX = event.clientX - canvasRect.left;
        const pointerY = event.clientY - canvasRect.top;
        const worldX = (pointerX - pan.x) / zoom;
        const worldY = (pointerY - pan.y) / zoom;
        const note = createNote({
          x: Math.max(0, worldX - DEFAULT_NOTE_WIDTH / 2),
          y: Math.max(0, worldY - DEFAULT_NOTE_HEIGHT / 2),
        });
        setEditingNoteId(note.id);
        return;
      }

      // 워크스페이스 클릭 시 선택된 테이블의 락 해제
      selectedTableIds.forEach((tableId) => {
        const table = tables.find((t) => t.id === tableId);
        if (table && table.key) {
          unlockTable(tableId);
          if (wsClient) {
            wsClient.sendTableUnlock(table.key);
            console.log('🔓 워크스페이스 클릭으로 락 해제:', table.key);
          }
        }
      });

      setSelectedTableIds([]);
    },
    [
      activeTool,
      createNote,
      isViewMode,
      pan.x,
      pan.y,
      setSelectedTableIds,
      zoom,
      selectedTableIds,
      tables,
      unlockTable,
      wsClient,
    ],
  );

  const closeInput = useCallback(() => {
    setIsInputVisible(false);
    setTableName('');
    setActiveTool('cursor');
  }, [setActiveTool]);

  const handleConfirm = useCallback(() => {
    if (!tableName.trim()) {
      return;
    }
    createTable(tableName);
    closeInput();
  }, [closeInput, createTable, tableName]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (isViewMode) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        handleConfirm();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeInput();
      }
    },
    [closeInput, handleConfirm, isViewMode],
  );

  const baseCursorClass = useMemo(() => {
    switch (activeTool) {
      case 'cursor':
        return 'cursor-default';
      case 'hand':
        return 'cursor-grab';
      case MULTI_SELECT_TOOL:
        return 'cursor-crosshair';
      case 'add-table':
        return 'cursor-copy';
      case 'memo':
        return 'cursor-text';
      default:
        return 'cursor-default';
    }
  }, [activeTool]);

  const canvasCursorClass = isCanvasPanning
    ? 'cursor-grabbing'
    : baseCursorClass;

  const handleDeleteTable = useCallback(
    (tableId: string) => {
      if (isViewMode) {
        return;
      }

      deleteTable(tableId);
      setSelectedTableIds((prev) => prev.filter((id) => id !== tableId));
      setDragState((prev) =>
        prev && prev.tables.includes(tableId) ? null : prev,
      );
    },
    [deleteTable, isViewMode],
  );

  const handleToggleTableComments = useCallback(
    (tableId: string) => {
      if (isViewMode) {
        return;
      }

      setActiveCommentTableId((prev) => (prev === tableId ? null : tableId));
      setTableComments((prev) => {
        if (prev[tableId]) {
          return prev;
        }

        return {
          ...prev,
          [tableId]: [
            {
              id: `comment-${Date.now()}`,
              author: '황지현',
              content: 'ㅇㄹㄴ궇ㅇㄹ',
              createdAt: '방금 전',
              avatarInitial: '황',
              replies: [],
            },
          ],
        };
      });
      setResolvedCommentTables((prev) => {
        if (prev[tableId] !== undefined) {
          return prev;
        }
        return {
          ...prev,
          [tableId]: false,
        };
      });
    },
    [isViewMode],
  );

  const handleCloseTableComments = useCallback(() => {
    setActiveCommentTableId(null);
  }, []);

  const handleSubmitTableComment = useCallback(
    (tableId: string, content: string) => {
      if (isViewMode) {
        return;
      }

      const nextComment: TableComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: '나',
        content,
        createdAt: '방금 전',
        avatarInitial: '나',
        replies: [],
      };
      setTableComments((prev) => {
        const current = prev[tableId] ?? [];
        return {
          ...prev,
          [tableId]: [...current, nextComment],
        };
      });
      setActiveCommentTableId(tableId);
    },
    [],
  );

  const handleUpdateTableComment = useCallback(
    (tableId: string, commentId: string, content: string) => {
      if (isViewMode) {
        return;
      }

      setTableComments((prev) => {
        const current = prev[tableId];
        if (!current) {
          return prev;
        }
        const index = current.findIndex((comment) => comment.id === commentId);
        if (index === -1) {
          return prev;
        }
        const nextComments = [...current];
        nextComments[index] = {
          ...nextComments[index],
          content,
        };
        return {
          ...prev,
          [tableId]: nextComments,
        };
      });
    },
    [isViewMode],
  );

  const handleDeleteTableComment = useCallback(
    (tableId: string, commentId: string) => {
      if (isViewMode) {
        return;
      }

      setTableComments((prev) => {
        const current = prev[tableId];
        if (!current) {
          return prev;
        }
        const nextComments = current.filter(
          (comment) => comment.id !== commentId,
        );
        return {
          ...prev,
          [tableId]: nextComments,
        };
      });
    },
    [isViewMode],
  );

  const handleSubmitTableReply = useCallback(
    (tableId: string, commentId: string, content: string) => {
      if (isViewMode) {
        return;
      }

      const nextReply: TableReply = {
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: '나',
        content,
        createdAt: '방금 전',
      };
      setTableComments((prev) => {
        const current = prev[tableId];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [tableId]: current.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: [...(comment.replies ?? []), nextReply],
                }
              : comment,
          ),
        };
      });
      setActiveCommentTableId(tableId);
    },
    [isViewMode],
  );

  const handleUpdateTableReply = useCallback(
    (tableId: string, commentId: string, replyId: string, content: string) => {
      if (isViewMode) {
        return;
      }

      setTableComments((prev) => {
        const current = prev[tableId];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [tableId]: current.map((comment) => {
            if (comment.id !== commentId) {
              return comment;
            }
            const replies = comment.replies ?? [];
            const nextReplies = replies.map((reply) =>
              reply.id === replyId ? { ...reply, content } : reply,
            );
            return {
              ...comment,
              replies: nextReplies,
            };
          }),
        };
      });
    },
    [isViewMode],
  );

  const handleDeleteTableReply = useCallback(
    (tableId: string, commentId: string, replyId: string) => {
      if (isViewMode) {
        return;
      }

      setTableComments((prev) => {
        const current = prev[tableId];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [tableId]: current.map((comment) => {
            if (comment.id !== commentId) {
              return comment;
            }
            const replies = comment.replies ?? [];
            const nextReplies = replies.filter((reply) => reply.id !== replyId);
            return {
              ...comment,
              replies: nextReplies,
            };
          }),
        };
      });
    },
    [isViewMode],
  );

  const handleToggleCommentResolved = useCallback(
    (tableId: string) => {
      if (isViewMode) {
        return;
      }

      setTableComments((prev) => {
        const current = prev[tableId];
        if (!current || current.length === 0) {
          return prev;
        }
        return {
          ...prev,
          [tableId]: [],
        };
      });
      setResolvedCommentTables((prev) => ({
        ...prev,
        [tableId]: true,
      }));
      if (activeCommentTableId === tableId) {
        setActiveCommentTableId(null);
      }
    },
    [activeCommentTableId, isViewMode],
  );

  const tableActionButtons = useMemo<TableActionButton[]>(() => {
    // 뷰어 모드에서는 액션 버튼 없음
    if (isViewMode) {
      return [];
    }

    return [
      {
        key: 'add-key',
        Icon: AddKeyIcon,
        bgClass: 'bg-key',
        label: '키 추가',
        onClick: addKeyColumn,
      },
      {
        key: 'add-column',
        Icon: PlusIcon,
        bgClass: 'bg-light-blue',
        label: '컬럼 추가',
        onClick: addColumn,
      },
      {
        key: 'change-color',
        Icon: PalatteIcon,
        bgClass: 'bg-custom',
        label: '색상 변경',
      },
      {
        key: 'delete',
        Icon: DeleteIcon,
        bgClass: 'bg-my-border',
        label: '테이블 삭제',
        onClick: handleDeleteTable,
      },
      {
        key: 'duplicate',
        Icon: CopyIcon,
        bgClass: 'bg-my-border',
        label: '테이블 복제',
        onClick: duplicateTable,
      },
      {
        key: 'create-memo',
        Icon: MemoIcon,
        bgClass: 'bg-[#f6e58d]',
        label: '댓글',
        onClick: handleToggleTableComments,
      },
    ];
  }, [
    isViewMode,
    addKeyColumn,
    addColumn,
    duplicateTable,
    handleToggleTableComments,
    handleDeleteTable,
  ]);

  const clampZoom = useCallback(
    (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value)),
    [],
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        return;
      }

      if (event.ctrlKey) {
        event.preventDefault();

        const canvasRect = canvasElement.getBoundingClientRect();
        const pointerX = event.clientX - canvasRect.left;
        const pointerY = event.clientY - canvasRect.top;
        const zoomMultiplier = event.deltaY < 0 ? 1.1 : 0.9;
        const nextZoom = clampZoom(zoom * zoomMultiplier);

        if (nextZoom === zoom) {
          return;
        }

        const worldX = (pointerX - pan.x) / zoom;
        const worldY = (pointerY - pan.y) / zoom;
        const nextPanX = pointerX - worldX * nextZoom;
        const nextPanY = pointerY - worldY * nextZoom;

        setPan({ x: nextPanX, y: nextPanY });
        setZoom(nextZoom);
        return;
      }

      if (event.shiftKey) {
        event.preventDefault();
        const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
        if (delta === 0) {
          return;
        }
        setPan((prev) => ({
          x: prev.x - delta,
          y: prev.y,
        }));
      }
    },
    [clampZoom, pan.x, pan.y, setPan, setZoom, zoom],
  );

  const handleCanvasMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isViewMode) {
        return;
      }

      if (event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest('[data-table-id]')) {
        return;
      }
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        return;
      }

      if (activeTool === MULTI_SELECT_TOOL) {
        event.preventDefault();
        const canvasRect = canvasElement.getBoundingClientRect();
        const localX = event.clientX - canvasRect.left;
        const localY = event.clientY - canvasRect.top;
        const startPoint = { x: localX, y: localY };
        setSelectionRect({ start: startPoint, current: startPoint });
        setSelectedTableIds([]);
        return;
      }

      if (activeTool !== 'hand' && activeTool !== 'cursor') {
        return;
      }

      event.preventDefault();
      panDragRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      panMovedRef.current = false;
      setIsCanvasPanning(true);
    },
    [activeTool, pan.x, pan.y, isViewMode],
  );

  useEffect(() => {
    if (!isCanvasPanning || isViewMode) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (event: MouseEvent) => {
      if (!panDragRef.current) {
        return;
      }
      const deltaX = event.clientX - panDragRef.current.startClientX;
      const deltaY = event.clientY - panDragRef.current.startClientY;

      if (
        !panMovedRef.current &&
        (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)
      ) {
        panMovedRef.current = true;
      }

      setPan({
        x: panDragRef.current.startPanX + deltaX,
        y: panDragRef.current.startPanY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsCanvasPanning(false);
      panDragRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = previousUserSelect;
      panDragRef.current = null;
    };
  }, [isCanvasPanning, setIsCanvasPanning, setPan, isViewMode]);

  useEffect(() => {
    if (!dragState || isViewMode) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handleMouseMove = (event: MouseEvent) => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) {
        return;
      }

      const canvasRect = canvasElement.getBoundingClientRect();
      const pointerX = event.clientX - canvasRect.left;
      const pointerY = event.clientY - canvasRect.top;
      const worldX = (pointerX - pan.x) / zoom;
      const worldY = (pointerY - pan.y) / zoom;

      setDragState((prev) => {
        if (!prev) {
          return null;
        }
        const deltaX = worldX - prev.pointerStart.worldX;
        const deltaY = worldY - prev.pointerStart.worldY;
        const nextPositions: Partial<Record<string, { x: number; y: number }>> =
          {};
        prev.tables.forEach((tableId) => {
          const start = prev.startPositions[tableId];
          if (!start) {
            return;
          }
          const newPosition = {
            x: start.x + deltaX,
            y: start.y + deltaY,
          };
          nextPositions[tableId] = newPosition;

          // WebSocket으로 드래그 중 위치 브로드캐스트
          const tableKey = parseInt(tableId.replace('table-', ''), 10);
          if (!isNaN(tableKey) && wsClient) {
            const x = Math.round(newPosition.x * 100) / 100; // 소수점 2자리
            const y = Math.round(newPosition.y * 100) / 100;
            wsClient.sendTableMove(tableKey, x, y);
          }
        });
        return {
          ...prev,
          currentPositions: nextPositions,
        };
      });
    };

    const handleMouseUp = () => {
      setDragState((prev) => {
        if (prev) {
          prev.tables.forEach((tableId) => {
            const position = prev.currentPositions[tableId];
            if (position) {
              updateTablePosition(tableId, position);

              // WebSocket으로 드래그 완료 브로드캐스트
              const tableKey = parseInt(tableId.replace('table-', ''), 10);
              if (!isNaN(tableKey) && wsClient) {
                const x = Math.round(position.x * 100) / 100; // 소수점 2자리
                const y = Math.round(position.y * 100) / 100;
                wsClient.sendTableMoveEnd(tableKey, x, y);
              }
            }
          });
        }
        return null;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = previousUserSelect;
    };
  }, [
    dragState,
    pan.x,
    pan.y,
    updateTablePosition,
    zoom,
    wsClient,
    isViewMode,
  ]);

  return (
    <div
      className={`relative flex-1 bg-my-white overflow-hidden ${canvasCursorClass}`}
    >
      {/* 뷰어 모드에서는 입력창 표시 안함 */}
      {!isViewMode && isInputVisible && (
        <div className="absolute top-16 left-16 z-30 w-64 rounded-lg border border-my-border bg-my-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-my-black">
              새 테이블 추가
            </span>
            <button
              type="button"
              onClick={closeInput}
              className="text-xs text-my-gray-500 hover:text-my-black"
            >
              ESC
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="workspace-table-name-input"
              className="text-xs text-my-gray-400"
            >
              테이블 이름
            </label>
            <input
              id="workspace-table-name-input"
              ref={inputRef}
              value={tableName}
              onChange={(event) => setTableName(event.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded border border-my-border px-2 py-1 text-sm text-my-black outline-none focus:border-blue focus:ring-1 focus:ring-blue"
              placeholder="예: Users"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeInput}
                className="rounded border border-my-border px-3 py-1 text-xs text-my-gray-500 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!tableName.trim()}
                className="rounded bg-blue px-3 py-1 text-xs font-semibold text-my-white transition-colors disabled:opacity-40"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={canvasRef}
        data-workspace-canvas="true"
        className="relative h-full w-full overflow-hidden"
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
      >
        {selectionRect && (
          <div
            className="absolute z-40 pointer-events-none border border-blue/60 bg-blue/10"
            style={{
              left: Math.min(selectionRect.start.x, selectionRect.current.x),
              top: Math.min(selectionRect.start.y, selectionRect.current.y),
              width: Math.abs(selectionRect.current.x - selectionRect.start.x),
              height: Math.abs(selectionRect.current.y - selectionRect.start.y),
            }}
          />
        )}
        <div
          className="absolute left-0 top-0 bg-my-white"
          style={{
            width: `${CANVAS_SIZE}px`,
            height: `${CANVAS_SIZE}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {notes.map((note) => {
            if (isViewMode) {
              return <NoteCard key={note.id} note={note} />;
            }
            return (
              <NoteCard
                key={note.id}
                note={note}
                autoFocus={editingNoteId === note.id}
                onChangeContent={(noteId: string, content: string) => {
                  updateNote(noteId, { content });
                  if (editingNoteId === noteId) {
                    setEditingNoteId(null);
                  }
                }}
                onChangeColor={(noteId: string, color: typeof note.color) => {
                  updateNote(noteId, { color });
                }}
                onDelete={(noteId: string) => {
                  deleteNote(noteId);
                  if (editingNoteId === noteId) {
                    setEditingNoteId(null);
                  }
                }}
              />
            );
          })}
          {tables.map((table) => {
            // 드래그 중인 테이블은 임시 위치 사용
            const overriddenPosition = dragState?.currentPositions[table.id];
            const displayTable = overriddenPosition
              ? {
                  ...table,
                  x: overriddenPosition.x,
                  y: overriddenPosition.y,
                }
              : table;

            return (
              <TableCard
                key={table.id}
                table={displayTable}
                actions={tableActionButtons}
                isSelected={selectedTableIds.includes(table.id)}
                isEditingDisabled={
                  isViewMode ||
                  activeTool === 'hand' ||
                  isDtoSelecting ||
                  isEntitySelecting
                }
                onSelect={(tableId, event) => {
                  // 뷰어 모드에서는 테이블 선택 비활성화
                  if (isViewMode) {
                    return;
                  }
                  // 손바닥 모드일 때는 테이블 선택 비활성화
                  if (activeTool === 'hand') {
                    return;
                  }
                  // 관계선 도구가 활성화된 경우
                  const isRelationTool = [
                    '013-relation',
                    '01-relation-1',
                    '01-relation',
                    '13-relation',
                    '11-relation',
                    '1-relation',
                  ].includes(activeTool);

                  if (isRelationTool) {
                    // 첫 번째 테이블 선택: 관계 타입 모달 열기
                    if (!relationDrawingState.sourceTableId) {
                      setRelationDrawingState({
                        sourceTableId: tableId,
                        selectedType: null,
                      });
                      setIsRelationTypeModalOpen(true);
                      return;
                    }

                    // 두 번째 테이블 선택: 관계선 생성
                    if (
                      relationDrawingState.sourceTableId &&
                      relationDrawingState.selectedType
                    ) {
                      // 자기 자신과는 관계선을 그을 수 없음
                      if (relationDrawingState.sourceTableId === tableId) {
                        alert('같은 테이블끼리는 관계선을 그을 수 없습니다.');
                        setRelationDrawingState({
                          sourceTableId: null,
                          selectedType: null,
                        });
                        return;
                      }

                      // cardinality 매핑
                      const cardinalityMap: Record<
                        string,
                        '1' | '11' | '13' | '01' | '01-1' | '013'
                      > = {
                        '1-relation': '1',
                        '11-relation': '11',
                        '13-relation': '13',
                        '01-relation': '01',
                        '01-relation-1': '01-1',
                        '013-relation': '013',
                      };

                      createRelation(
                        relationDrawingState.sourceTableId,
                        tableId,
                        relationDrawingState.selectedType,
                        cardinalityMap[activeTool] || '1',
                      );

                      // 상태 초기화
                      setRelationDrawingState({
                        sourceTableId: null,
                        selectedType: null,
                      });
                      setActiveTool('cursor');
                      return;
                    }
                  }

                  if (activeTool === MULTI_SELECT_TOOL) {
                    setSelectedTableIds((prev) => {
                      if (prev.includes(tableId)) {
                        return prev.filter((id) => id !== tableId);
                      }
                      return [...prev, tableId];
                    });
                    return;
                  }

                  // Ctrl/Cmd 키를 누르면 다중 선택
                  const isMultiSelect = event?.ctrlKey || event?.metaKey;
                  if (isMultiSelect) {
                    setSelectedTableIds((prev) => {
                      if (prev.includes(tableId)) {
                        return prev.filter((id) => id !== tableId);
                      }
                      return [...prev, tableId];
                    });
                    return;
                  }

                  setSelectedTableIds([tableId]);
                }}
                onUpdateName={updateTableName}
                onUpdateIdentifier={updateTableIdentifier}
                onUpdateColumn={updateTableColumn}
                onReorderColumn={reorderTableColumn}
                onDeleteColumn={deleteTableColumn}
                onUpdateColor={updateTableColor}
                comments={tableComments[table.id] ?? []}
                isCommentOpen={activeCommentTableId === table.id}
                onToggleComments={handleToggleTableComments}
                onCloseComments={handleCloseTableComments}
                onSubmitComment={handleSubmitTableComment}
                onUpdateComment={handleUpdateTableComment}
                onDeleteComment={handleDeleteTableComment}
                onSubmitReply={handleSubmitTableReply}
                onUpdateReply={handleUpdateTableReply}
                onDeleteReply={handleDeleteTableReply}
                isCommentResolved={Boolean(resolvedCommentTables[table.id])}
                onToggleCommentResolved={handleToggleCommentResolved}
                onLockTable={(tableId) => {
                  const table = tables.find((t) => t.id === tableId);
                  if (!table || !table.key) {
                    console.warn(
                      '❌ 테이블을 찾을 수 없거나 tableKey가 없습니다:',
                      tableId,
                    );
                    return false;
                  }

                  console.log('🔒 락 요청 시작:', {
                    tableId,
                    tableKey: table.key,
                    tableName: table.name,
                  });

                  // 락 요청
                  const canLock = lockTable(tableId);
                  if (canLock && wsClient) {
                    console.log('✅ 락 가능, WebSocket 전송:', table.key);
                    wsClient.sendTableLock(table.key);
                  } else {
                    console.warn('❌ 락 실패 또는 WebSocket 없음:', {
                      canLock,
                      wsClient: !!wsClient,
                    });
                  }
                  return canLock;
                }}
                onUnlockTable={(tableId) => {
                  const table = tables.find((t) => t.id === tableId);
                  if (!table || !table.key) {
                    console.warn(
                      '❌ 언락: 테이블을 찾을 수 없거나 tableKey가 없습니다:',
                      tableId,
                    );
                    return;
                  }

                  console.log('🔓 락 해제 시작:', {
                    tableId,
                    tableKey: table.key,
                    tableName: table.name,
                  });

                  // 락 해제
                  unlockTable(tableId);
                  if (wsClient) {
                    console.log('✅ WebSocket으로 언락 전송:', table.key);
                    wsClient.sendTableUnlock(table.key);
                  } else {
                    console.warn('❌ WebSocket이 없어서 언락 전송 실패');
                  }
                }}
                onAddColumn={addColumn}
                onColumnUpdateApi={async (columnKey, updates) => {
                  try {
                    await updateColumnApi(columnKey, updates);
                    console.log('✅ 컬럼 업데이트 API 호출 성공:', columnKey);
                  } catch (error) {
                    console.error('❌ 컬럼 업데이트 API 호출 실패:', error);
                    throw error;
                  }
                }}
                onDragStart={(event, currentTable, _bounds) => {
                  void _bounds;
                  // 뷰어 모드에서는 테이블 드래그 비활성화
                  if (isViewMode) {
                    return;
                  }
                  // 손바닥 모드일 때는 테이블 드래그 비활성화
                  if (activeTool === 'hand') {
                    return;
                  }
                  if (
                    activeTool !== MULTI_SELECT_TOOL &&
                    activeTool !== 'cursor' &&
                    activeTool !== 'hand'
                  ) {
                    return;
                  }

                  const canvasElement = canvasRef.current;
                  if (!canvasElement) {
                    return;
                  }

                  const canvasRect = canvasElement.getBoundingClientRect();
                  const pointerX = event.clientX - canvasRect.left;
                  const pointerY = event.clientY - canvasRect.top;
                  const worldX = (pointerX - pan.x) / zoom;
                  const worldY = (pointerY - pan.y) / zoom;

                  event.preventDefault();
                  let nextSelectedIds = selectedTableIds;
                  if (activeTool !== MULTI_SELECT_TOOL) {
                    nextSelectedIds = [currentTable.id];
                  } else if (!nextSelectedIds.includes(currentTable.id)) {
                    nextSelectedIds = [...nextSelectedIds, currentTable.id];
                  }
                  setSelectedTableIds(nextSelectedIds);

                  const targetTableIds = nextSelectedIds;

                  const startPositions = targetTableIds.reduce<
                    Partial<Record<string, { x: number; y: number }>>
                  >((acc, tableId) => {
                    const original = tables.find((item) => item.id === tableId);
                    if (original) {
                      acc[tableId] = { x: original.x, y: original.y };
                    }
                    return acc;
                  }, {});

                  const availableTableIds = targetTableIds.filter(
                    (tableId) => startPositions[tableId],
                  );

                  const currentPositions = availableTableIds.reduce<
                    Partial<Record<string, { x: number; y: number }>>
                  >((acc, tableId) => {
                    const startPosition = startPositions[tableId];
                    if (!startPosition) {
                      return acc;
                    }
                    acc[tableId] = { ...startPosition };
                    return acc;
                  }, {});

                  if (availableTableIds.length === 0) {
                    return;
                  }

                  setDragState({
                    tables: availableTableIds,
                    pointerStart: { worldX, worldY },
                    startPositions,
                    currentPositions,
                  });
                }}
              />
            );
          })}

          {/* 관계선 카디널리티 마커 및 상호작용 요소 (테이블 위) */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${CANVAS_SIZE}px`,
              height: `${CANVAS_SIZE}px`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#64748b" />
              </marker>
            </defs>
            <g style={{ pointerEvents: 'auto' }}>
              {relations.map((relation) => (
                <RelationLine
                  key={relation.id}
                  relation={relation}
                  tables={tables}
                  // zoom={1}
                  // pan={{ x: 0, y: 0 }}
                  onDelete={deleteRelation}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* 관계선 타입 선택 모달 */}
      <RelationTypeModal
        isOpen={isRelationTypeModalOpen}
        onClose={() => {
          setIsRelationTypeModalOpen(false);
          setRelationDrawingState({
            sourceTableId: null,
            selectedType: null,
          });
        }}
        onSelect={(type) => {
          setRelationDrawingState((prev) => ({
            ...prev,
            selectedType: type,
          }));
          setIsRelationTypeModalOpen(false);
        }}
      />

      <MiniMap />
    </div>
  );
};

export default WorkspaceCanvas;
