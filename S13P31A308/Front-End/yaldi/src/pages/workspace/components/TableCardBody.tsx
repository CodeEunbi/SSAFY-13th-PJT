import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import MoveColumnIcon from '../../../assets/icons/move_column_icon.svg?react';
import DeleteIcon from '../../../assets/icons/delete_icon.svg?react';
import PkIcon from '../../../assets/icons/pk_icon.svg?react';
import FkIcon from '../../../assets/icons/fk_icon.svg?react';
import type { WorkspaceTable } from '../../../types/tableCard';
import type { SelectedColumn } from '../../../stores/dtoSelectionStore';

type ColumnField =
  | 'logicalName'
  | 'physicalName'
  | 'dataType'
  | 'allowNull'
  | 'defaultValue'
  | 'comment';

type TableCardBodyProps = {
  table: WorkspaceTable;
  isSelected: boolean;
  isEditingDisabled: boolean;
  isDtoSelecting: boolean;
  selectedDtoColumns: Record<string, SelectedColumn>;
  setColumnSelection: (
    tableId: string,
    columnId: string,
    selected: boolean,
  ) => void;
  onUpdateColumn: (
    tableId: string,
    columnId: string,
    updates: Partial<WorkspaceTable['columns'][number]>,
  ) => void;
  onReorderColumn: (
    tableId: string,
    columnId: string,
    targetIndex: number,
  ) => void;
  onDeleteColumn: (tableId: string, columnId: string) => void;
  onAddColumn?: (tableId: string) => void;
  onColumnUpdateApi?: (columnKey: number, updates: Record<string, unknown>) => Promise<void>;
};

const FIELD_ORDER: ColumnField[] = [
  'logicalName',
  'physicalName',
  'dataType',
  'allowNull',
  'defaultValue',
  'comment',
];

const TableCardBody: React.FC<TableCardBodyProps> = ({
  table,
  isSelected,
  isEditingDisabled,
  isDtoSelecting,
  selectedDtoColumns,
  setColumnSelection,
  onUpdateColumn,
  onReorderColumn,
  onDeleteColumn,
  onAddColumn,
  onColumnUpdateApi,
}) => {
  const [rowPositions, setRowPositions] = useState<
    Record<string, { top: number; height: number }>
  >({});
  const [editingCell, setEditingCell] = useState<{
    columnId: string;
    field: ColumnField;
  } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [focusedColumnId, setFocusedColumnId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);

  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const columnsRef = useRef(table.columns);
  const lastTargetIndexRef = useRef<number | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const cellInputRef = useRef<HTMLInputElement | null>(null);

  const cellBorderClass = isSelected
    ? 'border border-[#1f3f9d]'
    : 'border-[0.5px] border-[#9fb4ec]';

  useLayoutEffect(() => {
    if (!isDtoSelecting || !tbodyRef.current) {
      setRowPositions({});
      return;
    }

    const nextPositions: Record<string, { top: number; height: number }> = {};

    Object.entries(rowRefs.current).forEach(([columnId, node]) => {
      if (node) {
        nextPositions[columnId] = {
          top: node.offsetTop,
          height: node.offsetHeight,
        };
      }
    });

    setRowPositions(nextPositions);
  }, [isDtoSelecting, table.columns]);

  useEffect(() => {
    columnsRef.current = table.columns;
  }, [table.columns]);

  useEffect(() => {
    if (!editingCell) {
      return;
    }

    const timer = window.setTimeout(() => {
      cellInputRef.current?.focus();
      cellInputRef.current?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [editingCell]);

  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  useEffect(() => {
    if (!isSelected) {
      setFocusedColumnId(null);
      setDraggingColumnId(null);
      setEditingCell(null);
      setCellValue('');
    }
  }, [isSelected]);

  useEffect(() => {
    if (!isEditingDisabled) {
      return;
    }
    setEditingCell(null);
    setCellValue('');
  }, [isEditingDisabled]);

  const callUpdateApi = useCallback(
    async (columnId: string) => {
      const column = table.columns.find((col) => col.id === columnId);
      if (!column || !column.key || !onColumnUpdateApi) {
        return;
      }

      const updates: Record<string, unknown> = {
        logicalName: column.logicalName,
        physicalName: column.physicalName,
        dataType: column.dataType,
        isNullable: column.allowNull === 'Y',
        defaultValue: column.defaultValue,
        comment: column.comment,
      };

      try {
        await onColumnUpdateApi(column.key, updates);
      } catch (error) {
        console.error('컬럼 업데이트 API 호출 실패:', error);
      }
    },
    [table.columns, onColumnUpdateApi],
  );

  const beginEditCell = useCallback(
    (columnId: string, field: ColumnField) => {
      if (isEditingDisabled) {
        return;
      }

      // 이전에 편집 중이던 셀이 있고, 다른 row로 이동하는 경우 API 호출
      if (editingCell && editingCell.columnId !== columnId) {
        callUpdateApi(editingCell.columnId);
      }

      setEditingCell({ columnId, field });
      setFocusedColumnId(columnId);
      const column = table.columns.find((item) => item.id === columnId);
      setCellValue(column ? (column[field] as string) : '');
    },
    [isEditingDisabled, table.columns, editingCell, callUpdateApi],
  );

  const handleCellChange = useCallback(
    (value: string) => {
      setCellValue(value);
      if (editingCell) {
        onUpdateColumn(table.id, editingCell.columnId, {
          [editingCell.field]: value,
        });
      }
    },
    [editingCell, onUpdateColumn, table.id],
  );

  const handleCellKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setEditingCell(null);
        setCellValue('');
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();

        if (!editingCell) {
          return;
        }

        const currentColumnIndex = table.columns.findIndex(
          (col) => col.id === editingCell.columnId,
        );
        const currentFieldIndex = FIELD_ORDER.indexOf(editingCell.field);

        // 현재 컬럼에 대해 API 호출
        callUpdateApi(editingCell.columnId);

        // 다음 field로 이동
        if (currentFieldIndex < FIELD_ORDER.length - 1) {
          // 같은 row의 다음 field로 이동
          const nextField = FIELD_ORDER[currentFieldIndex + 1];
          beginEditCell(editingCell.columnId, nextField);
        } else {
          // 마지막 field (comment)에서 Enter를 누른 경우
          if (currentColumnIndex < table.columns.length - 1) {
            // 다음 row의 첫 번째 field로 이동
            const nextColumn = table.columns[currentColumnIndex + 1];
            beginEditCell(nextColumn.id, FIELD_ORDER[0]);
          } else {
            // 마지막 row의 마지막 field에서 Enter를 누른 경우
            // 새 컬럼 생성
            if (onAddColumn) {
              onAddColumn(table.id);
              setEditingCell(null);
              setCellValue('');
              // 새 컬럼이 생성된 후 첫 번째 field로 이동 (useEffect에서 처리)
            }
          }
        }
      }
    },
    [editingCell, table.columns, table.id, callUpdateApi, beginEditCell, onAddColumn],
  );

  const handleColumnDragStart = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, columnId: string) => {
      if (event.button !== 0) {
        return;
      }
      // 편집 비활성화 상태일 때는 컬럼 드래그 비활성화
      if (isEditingDisabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (dragCleanupRef.current) {
        dragCleanupRef.current();
      }

      const initialColumns = columnsRef.current;
      const initialIndex = initialColumns.findIndex(
        (column) => column.id === columnId,
      );
      lastTargetIndexRef.current = initialIndex === -1 ? null : initialIndex;
      setFocusedColumnId(columnId);
      setDraggingColumnId(columnId);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        moveEvent.preventDefault();

        const currentColumns = columnsRef.current;
        if (currentColumns.length <= 1) {
          return;
        }

        const otherColumns = currentColumns.filter(
          (column) => column.id !== columnId,
        );
        if (otherColumns.length === 0) {
          return;
        }

        let targetIndex = otherColumns.length;
        const pointerY = moveEvent.clientY;

        for (let index = 0; index < otherColumns.length; index += 1) {
          const targetColumn = otherColumns[index];
          const rowElement = rowRefs.current[targetColumn.id];
          if (!rowElement) {
            continue;
          }

          const rect = rowElement.getBoundingClientRect();
          if (pointerY < rect.top + rect.height / 2) {
            targetIndex = index;
            break;
          }
        }

        const currentIndex = currentColumns.findIndex(
          (column) => column.id === columnId,
        );
        if (currentIndex === -1) {
          return;
        }

        const workingColumns = [...currentColumns];
        const [movingColumn] = workingColumns.splice(currentIndex, 1);
        if (!movingColumn) {
          return;
        }

        const clampedTarget = Math.max(
          0,
          Math.min(targetIndex, workingColumns.length),
        );

        if (clampedTarget === currentIndex) {
          return;
        }

        if (lastTargetIndexRef.current === clampedTarget) {
          return;
        }

        workingColumns.splice(clampedTarget, 0, movingColumn);
        columnsRef.current = workingColumns;
        lastTargetIndexRef.current = clampedTarget;
        onReorderColumn(table.id, columnId, clampedTarget);
      };

      const finalize = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        setDraggingColumnId(null);
        lastTargetIndexRef.current = null;
        dragCleanupRef.current = null;
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        finalize();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      dragCleanupRef.current = finalize;
    },
    [isEditingDisabled, onReorderColumn, table.id],
  );

  const dtoCheckboxes = useMemo(() => {
    if (!isDtoSelecting) {
      return null;
    }

    return (
      <div className="pointer-events-none absolute left-[-40px] top-0 h-full w-8">
        {table.columns.map((column) => {
          const position = rowPositions[column.id];
          if (!position) {
            return null;
          }
          const checkboxTop = position.top + position.height / 2;
          return (
            <label
              key={column.id}
              className="pointer-events-auto absolute left-1/2 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ top: `${checkboxTop}px` }}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue"
                checked={Boolean(
                  selectedDtoColumns[`${table.id}:${column.id}`],
                )}
                onChange={(event) =>
                  setColumnSelection(table.id, column.id, event.target.checked)
                }
                onClick={(event) => event.stopPropagation()}
              />
            </label>
          );
        })}
      </div>
    );
  }, [
    isDtoSelecting,
    rowPositions,
    selectedDtoColumns,
    setColumnSelection,
    table.columns,
    table.id,
  ]);

  return (
    <div className="relative rounded-b-lg bg-white">
      <table className="table-fixed border-collapse text-xs text-[#1c2a4a]">
        <colgroup>
          <col style={{ width: '40px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: '160px' }} />
          <col style={{ width: '144px' }} />
          <col style={{ width: '112px' }} />
          <col style={{ width: '144px' }} />
          <col />
        </colgroup>
        <thead className="bg-[#eef3ff] text-[11px] font-semibold uppercase tracking-wide" />
        <tbody ref={tbodyRef}>
          {table.columns.map((column) => {
            const isRowFocused =
              !isDtoSelecting &&
              (focusedColumnId === column.id ||
                editingCell?.columnId === column.id ||
                draggingColumnId === column.id);
            const isDragging = draggingColumnId === column.id;
            return (
              <tr
                key={column.id}
                ref={(node) => {
                  if (node) {
                    rowRefs.current[column.id] = node;
                  } else {
                    delete rowRefs.current[column.id];
                  }
                }}
                onMouseDown={() => {
                  if (isDtoSelecting) {
                    return;
                  }
                  // 편집 비활성화 상태일 때는 컬럼 선택 비활성화
                  if (isEditingDisabled) {
                    return;
                  }
                  setFocusedColumnId(column.id);
                }}
                className={`transition-colors ${
                  isRowFocused ? 'bg-[#f0f6ff]' : 'bg-white'
                } ${isDragging ? 'cursor-grabbing opacity-90' : ''}`}
                style={
                  isRowFocused
                    ? {
                        outline: '2px solid #1f3f9d',
                        outlineOffset: '-2px',
                        borderRadius: '6px',
                      }
                    : undefined
                }
              >
                <td
                  className={`${cellBorderClass} relative px-1 py-2 text-center`}
                >
                  {!isDtoSelecting && isRowFocused ? (
                    <button
                      type="button"
                      className="absolute left-[-32px] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-white shadow hover:bg-[#e0e9ff]"
                      aria-label="컬럼 순서 이동"
                      onMouseDown={(event) =>
                        handleColumnDragStart(event, column.id)
                      }
                    >
                      <MoveColumnIcon className="h-4 w-4 text-[#1f3f9d]" />
                    </button>
                  ) : null}
                  {column.isPK && (
                    <PkIcon className="mx-auto h-5 w-5" />
                  )}
                  {column.isFK && (
                    <FkIcon className="mx-auto h-5 w-5" />
                  )}
                </td>
                {(
                  [
                    'logicalName',
                    'physicalName',
                    'dataType',
                    'allowNull',
                    'defaultValue',
                    'comment',
                  ] as const satisfies ReadonlyArray<ColumnField>
                ).map((field) => (
                  <td
                    key={field}
                    className={`${cellBorderClass} ${
                      field === 'comment' ? 'relative' : ''
                    } px-3 py-2`}
                  >
                    {!isDtoSelecting &&
                    editingCell &&
                    editingCell.columnId === column.id &&
                    editingCell.field === field ? (
                      <input
                        ref={cellInputRef}
                        value={cellValue}
                        onChange={(event) =>
                          handleCellChange(event.target.value)
                        }
                        onKeyDown={handleCellKeyDown}
                        onFocus={() => setFocusedColumnId(column.id)}
                        className="w-full rounded border border-[#A5B5E0] bg-white px-2 py-1 text-xs text-[#1c2a4a] outline-none focus:border-blue focus:ring-1 focus:ring-blue"
                      />
                    ) : (
                      <button
                        type="button"
                        onFocus={() => {
                          if (!isEditingDisabled) {
                            setFocusedColumnId(column.id);
                          }
                        }}
                        onClick={() => {
                          if (!isEditingDisabled) {
                            setFocusedColumnId(column.id);
                          }
                        }}
                        onDoubleClick={() => beginEditCell(column.id, field)}
                        disabled={isEditingDisabled}
                        className={`w-full text-left text-xs text-[#1c2a4a] ${
                          isEditingDisabled ? 'cursor-not-allowed' : ''
                        }`}
                      >
                        {column[field]}
                      </button>
                    )}
                    {field === 'comment' &&
                    isRowFocused &&
                    !isEditingDisabled ? (
                      <button
                        type="button"
                        className="absolute right-[-32px] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-white shadow hover:bg-[#ffe5e5]"
                        aria-label="컬럼 삭제"
                        onMouseDown={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          onDeleteColumn(table.id, column.id);
                        }}
                      >
                        <DeleteIcon className="h-4 w-4 text-[#d92c2c]" />
                      </button>
                    ) : null}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {dtoCheckboxes}
    </div>
  );
};

export default React.memo(TableCardBody);
