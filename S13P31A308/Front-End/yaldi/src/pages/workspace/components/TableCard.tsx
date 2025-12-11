import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDtoSelectionStore } from '../../../stores/dtoSelectionStore';
import { useEntitySelectionStore } from '../../../stores/entitySelectionStore';
import TableCardHeader from './TableCardHeader';
import TableCardBody from './TableCardBody';
import TableCardActionButtons from './TableCardActionButtons';
import TableCardCommentPanel from './TableCardCommentPanel';
// import TableCardFooter from './TableCardFooter';
import type {
  WorkspaceTable,
  TableActionButton,
  TableComment,
} from '../../../types/tableCard';

export type TableCardProps = {
  table: WorkspaceTable;
  isSelected: boolean;
  onSelect: (tableId: string, event?: React.MouseEvent<HTMLDivElement>) => void;
  actions: TableActionButton[];
  isEditingDisabled?: boolean;
  onUpdateName: (tableId: string, name: string) => void;
  onUpdateIdentifier: (tableId: string, identifier: string) => void;
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
  onUpdateColor: (tableId: string, color: WorkspaceTable['color']) => void;
  onDragStart?: (
    event: React.MouseEvent<HTMLDivElement>,
    table: WorkspaceTable,
    bounds: DOMRect | null,
  ) => void;
  comments?: TableComment[];
  isCommentOpen?: boolean;
  onToggleComments?: (tableId: string) => void;
  onCloseComments?: () => void;
  onSubmitComment?: (tableId: string, content: string) => void;
  onUpdateComment?: (
    tableId: string,
    commentId: string,
    content: string,
  ) => void;
  onDeleteComment?: (tableId: string, commentId: string) => void;
  onSubmitReply?: (tableId: string, commentId: string, content: string) => void;
  onUpdateReply?: (
    tableId: string,
    commentId: string,
    replyId: string,
    content: string,
  ) => void;
  onDeleteReply?: (tableId: string, commentId: string, replyId: string) => void;
  isCommentResolved?: boolean;
  onToggleCommentResolved?: (tableId: string) => void;
  onLockTable?: (tableId: string) => boolean;
  onUnlockTable?: (tableId: string) => void;
  onAddColumn?: (tableId: string) => void;
  onColumnUpdateApi?: (columnKey: number, updates: Record<string, unknown>) => Promise<void>;
};

const TableCard: React.FC<TableCardProps> = ({
  table,
  isSelected,
  onSelect,
  actions,
  isEditingDisabled = false,
  onUpdateName,
  onUpdateIdentifier,
  onUpdateColumn,
  onReorderColumn,
  onDeleteColumn,
  onUpdateColor,
  onDragStart,
  comments = [],
  isCommentOpen = false,
  onToggleComments,
  onCloseComments,
  onSubmitComment,
  onUpdateComment,
  onDeleteComment,
  onSubmitReply,
  onUpdateReply,
  onDeleteReply,
  isCommentResolved = false,
  onToggleCommentResolved,
  onLockTable,
  onUnlockTable,
  onAddColumn,
  onColumnUpdateApi,
}) => {
  const isDtoSelecting = useDtoSelectionStore((state) => state.isSelecting);
  const selectedDtoColumns = useDtoSelectionStore(
    (state) => state.selectedColumns,
  );
  const setColumnSelection = useDtoSelectionStore(
    (state) => state.setColumnSelection,
  );

  const isEntitySelecting = useEntitySelectionStore(
    (state) => state.isSelecting,
  );
  const selectedEntityTableId = useEntitySelectionStore(
    (state) => state.selectedTableId,
  );
  const setSelectedEntityTable = useEntitySelectionStore(
    (state) => state.setSelectedTable,
  );

  const cardRef = useRef<HTMLDivElement | null>(null);
  const memoButtonRef = useRef<HTMLButtonElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  // const [originalTable, setOriginalTable] = useState<WorkspaceTable | null>(
  //   null,
  // );

  const memoAction = useMemo(
    () => actions.find((action) => action.key === 'create-memo'),
    [actions],
  );

  useEffect(() => {
    if (!isSelected && isCommentOpen) {
      onCloseComments?.();
    }
  }, [isCommentOpen, isSelected, onCloseComments]);

  // 편집 중일 때 선택 해제 방지
  // 다만, 다른 테이블을 선택할 때는 편집 모드를 종료하도록 수정
  useEffect(() => {
    if (!isSelected && isEditing) {
      // 편집 중인데 선택이 해제되면 편집 모드 종료 및 락 해제
      setIsEditing(false);
      // setOriginalTable(null);

      // 락 해제 요청
      onUnlockTable?.(table.id);
    }
  }, [isSelected, isEditing, onUnlockTable, table.id]);

  const handleSelect = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();

      // 다른 사용자가 락을 보유 중이면 선택 불가 (자신의 락은 허용)
      if (table.isLocked && table.lockedBy) {
        // 이미 다른 사용자가 편집 중인 경우만 차단
        alert(`${table.lockedBy.userName}님이 편집 중입니다.`);
        return;
      }

      onSelect(table.id, event);
      if (!isEditing) {
        // 락 요청
        const canLock = onLockTable?.(table.id) ?? true;
        if (!canLock) {
          console.warn('테이블 락 획득 실패');
          return;
        }

        setIsEditing(true);
        // setOriginalTable(table);
      }
    },
    [onSelect, table, isEditing, onLockTable],
  );

  // const handleApply = useCallback(() => {
  //   setIsEditing(false);
  //   setOriginalTable(null);
  //   onSelect(''); // 테이블 선택 해제
  //   // 락 해제
  //   onUnlockTable?.(table.id);
  // }, [onSelect, onUnlockTable, table.id]);

  // const handleCancel = useCallback(() => {
  //   if (originalTable) {
  //     // 원래 상태로 복구
  //     onUpdateName(table.id, originalTable.name);
  //     onUpdateIdentifier(table.id, originalTable.identifier);
  //     // 컬럼도 원래대로 복구 필요시 추가
  //   }
  //   setIsEditing(false);
  //   setOriginalTable(null);
  //   onSelect(''); // 테이블 선택 해제
  //   // 락 해제
  //   onUnlockTable?.(table.id);
  // }, [
  //   originalTable,
  //   table.id,
  //   onUpdateName,
  //   onUpdateIdentifier,
  //   onSelect,
  //   onUnlockTable,
  // ]);

  const handleHeaderMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest('button, input, textarea')) {
        return;
      }
      onDragStart?.(
        event,
        table,
        cardRef.current?.getBoundingClientRect() ?? null,
      );
    },
    [onDragStart, table],
  );

  const outerBorderClass = isSelected
    ? 'border-2 border-[#1f3f9d]'
    : 'border-[0.5px] border-[#9fb4ec]';
  const headerBorderClass = isSelected
    ? 'border-b-[0.5px] border-[#1f3f9d]'
    : 'border-b-[0.5px] border-[#9fb4ec]';
  const lightBackgroundColors: WorkspaceTable['color'][] = [
    'user3',
    'user5',
    'user6',
    'user7',
  ];
  const isLightBackground = lightBackgroundColors.includes(table.color);
  const headerBgClass = `bg-${table.color}`;
  const headerTextClass = isLightBackground ? 'text-[#1c2a4a]' : 'text-white';
  const subTextClass = isLightBackground ? 'text-[#1c2a4a]' : 'text-white/80';

  // 락 상태에 따른 스타일 적용
  const lockedStyle = table.isLocked
    ? { opacity: 0.7, pointerEvents: 'none' as const }
    : {};

  return (
    <div
      ref={cardRef}
      data-table-id={table.id}
      data-table-key={table.key}
      onClick={handleSelect}
      className={`absolute min-w-fit overflow-visible rounded-lg bg-white transition-all ${outerBorderClass}`}
      style={{ top: table.y, left: table.x, ...lockedStyle }}
    >
      {/* 락 인디케이터 */}
      {table.isLocked && table.lockedBy && (
        <div
          className="absolute -right-2 -top-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-lg"
          style={{ pointerEvents: 'auto' }}
        >
          {table.lockedBy.userName} 편집 중
        </div>
      )}
      {isEntitySelecting ? (
        <label
          className="absolute -left-6 top-4 z-30 flex h-5 w-5 -translate-x-full items-center justify-center"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            disabled={table.columns.length === 0}
            className="h-4 w-4 accent-blue"
            checked={selectedEntityTableId === table.id}
            onChange={(event) =>
              setSelectedEntityTable(event.target.checked ? table.id : null)
            }
            onClick={(event) => event.stopPropagation()}
          />
        </label>
      ) : null}
      <TableCardActionButtons
        tableId={table.id}
        tableColor={table.color}
        actions={actions}
        isSelected={isSelected}
        isEditingDisabled={isEditingDisabled}
        onUpdateColor={onUpdateColor}
      />
      <TableCardCommentPanel
        tableId={table.id}
        memoAction={memoAction}
        isSelected={isSelected}
        isEditingDisabled={isEditingDisabled}
        isCommentOpen={isCommentOpen}
        comments={comments}
        isCommentResolved={isCommentResolved}
        memoButtonRef={memoButtonRef}
        onToggleComments={onToggleComments}
        onCloseComments={onCloseComments}
        onToggleCommentResolved={onToggleCommentResolved}
        onSubmitComment={onSubmitComment}
        onUpdateComment={onUpdateComment}
        onDeleteComment={onDeleteComment}
        onSubmitReply={onSubmitReply}
        onUpdateReply={onUpdateReply}
        onDeleteReply={onDeleteReply}
      />
      <TableCardHeader
        table={table}
        isEditingDisabled={isEditingDisabled}
        headerBorderClass={headerBorderClass}
        headerBgClass={headerBgClass}
        headerTextClass={headerTextClass}
        subTextClass={subTextClass}
        onUpdateName={onUpdateName}
        onUpdateIdentifier={onUpdateIdentifier}
        onHeaderMouseDown={handleHeaderMouseDown}
      />
      <TableCardBody
        table={table}
        isSelected={isSelected}
        isEditingDisabled={isEditingDisabled}
        isDtoSelecting={isDtoSelecting}
        selectedDtoColumns={selectedDtoColumns}
        setColumnSelection={setColumnSelection}
        onUpdateColumn={onUpdateColumn}
        onReorderColumn={onReorderColumn}
        onDeleteColumn={onDeleteColumn}
        onAddColumn={onAddColumn}
        onColumnUpdateApi={onColumnUpdateApi}
      />
      {/* <TableCardFooter
        isVisible={isSelected && isEditing}
        onApply={handleApply}
        onCancel={handleCancel}
      /> */}
    </div>
  );
};

export type {
  TableActionButton,
  TableComment,
  TableReply,
} from '../../../types/tableCard';
export default TableCard;
