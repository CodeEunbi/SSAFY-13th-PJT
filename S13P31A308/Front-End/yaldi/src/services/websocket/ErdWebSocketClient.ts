/**
 * ERD WebSocket 클라이언트
 * STOMP over SockJS를 사용한 실시간 협업 통신
 */

import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {
  WebSocketOptions,
  EventHandlers,
  WebSocketResponse,
  ErdBroadcastEvent,
  ErdEvent,
  ColumnReorderEvent,
  CursorMoveEvent,
} from './types';

const WS_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ErdWebSocketClient {
  private stompClient: Client | null = null;
  private projectKey: number;
  private accessToken: string;
  private isConnected = false;
  private eventHandlers: EventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor(options: WebSocketOptions) {
    this.projectKey = options.projectKey;
    this.accessToken = options.accessToken;

    if (options.onConnect) {
      this.eventHandlers.onTableMove = options.onConnect as never;
    }
  }

  /**
   * WebSocket 연결 시작
   */
  connect(): void {
    if (this.isConnected) {
      console.warn('WebSocket is already connected');
      return;
    }

    // SockJS 소켓 생성
    const socket = new SockJS(`${WS_BASE_URL}/ws`);

    // STOMP 클라이언트 생성
    this.stompClient = new Client({
      webSocketFactory: () => socket as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log('[STOMP Debug]', str);
        }
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('✅ WebSocket connected to project:', this.projectKey);

        // 프로젝트 토픽 구독
        this.subscribe();
      },

      onDisconnect: () => {
        this.isConnected = false;
        console.log('⚠️ WebSocket disconnected');
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame.headers['message']);
        console.error('Details:', frame.body);

        // 재연결 시도
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(
            `🔄 Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
          );
        }
      },

      onWebSocketError: (error) => {
        console.error('❌ WebSocket error:', error);
      },
    });

    // 연결 활성화
    this.stompClient.activate();
  }

  /**
   * 프로젝트 토픽 구독
   */
  private subscribe(): void {
    if (!this.stompClient || !this.isConnected) {
      console.error('Cannot subscribe: client not connected');
      return;
    }

    const topic = `/topic/project/${this.projectKey}`;

    this.stompClient.subscribe(topic, (message: IMessage) => {
      this.handleMessage(message);
    });

    console.log('📡 Subscribed to topic:', topic);
  }

  /**
   * 수신 메시지 처리
   */
  private handleMessage(message: IMessage): void {
    try {
      const response: WebSocketResponse = JSON.parse(message.body);

      console.log('📨 Received WebSocket message:', response);

      // WebSocketResponse를 ErdBroadcastEvent로 변환
      const broadcastEvent: ErdBroadcastEvent = {
        projectKey: response.projectKey,
        userKey: response.userKey ?? 0, // null인 경우 0으로 처리
        event: response.event as ErdEvent, // 서버에서 오는 이벤트 타입
      };

      console.log('📨 BEFORE DISPATCH:', response);
      this.dispatchEvent(broadcastEvent);
      console.log('📨 AFTER DISPATCH:', response);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * 이벤트 디스패치
   */
  private dispatchEvent(event: ErdBroadcastEvent): void {
    const eventType = event.event.type;
    console.log('Dispatching event type:', eventType);
    switch (eventType) {
      case 'TABLE_MOVE':
        this.eventHandlers.onTableMove?.(event);
        break;
      case 'TABLE_MOVE_END':
        this.eventHandlers.onTableMoveEnd?.(event);
        break;
      case 'COLUMN_REORDER':
        this.eventHandlers.onColumnReorder?.(event);
        break;
      case 'TABLE_LOCK':
        this.eventHandlers.onTableLock?.(event);
        break;
      case 'TABLE_UNLOCK':
        this.eventHandlers.onTableUnlock?.(event);
        break;
      case 'CURSOR_MOVE':
        this.eventHandlers.onCursorMove?.(event);
        break;
      case 'TABLE_NEW':
        this.eventHandlers.onTableCreate?.(event);
        break;
      case 'TABLE_UPDATE':
        this.eventHandlers.onTableUpdate?.(event);
        break;
      case 'TABLE_DEL':
        this.eventHandlers.onTableDelete?.(event);
        break;
      case 'COLUMN_NEW':
        this.eventHandlers.onColumnCreate?.(event);
        break;
      case 'COLUMN_UPDATED':
        this.eventHandlers.onColumnUpdate?.(event);
        break;
      case 'COLUMN_DEL':
        this.eventHandlers.onColumnDelete?.(event);
        break;
      case 'RELATION_NEW':
        this.eventHandlers.onRelationCreate?.(event);
        break;
      case 'RELATION_UPDATE':
        this.eventHandlers.onRelationUpdate?.(event);
        break;
      case 'RELATION_DELETE':
        this.eventHandlers.onRelationDelete?.(event);
        break;
      default:
        console.warn('Unknown event type:', eventType);
    }
  }

  /**
   * 이벤트 핸들러 등록
   */
  setEventHandlers(handlers: EventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * 테이블 이동 전송 (드래그 중)
   */
  sendTableMove(tableKey: number, xPosition: number, yPosition: number): void {
    if (!this.isConnected || !this.stompClient) {
      console.warn('Cannot send: WebSocket not connected');
      return;
    }

    const payload = {
      type: 'TABLE_MOVE',
      tableKey: Number(tableKey),
      xPosition: Number(xPosition),
      yPosition: Number(yPosition),
    };

    console.log('📤 Sending TABLE_MOVE:', JSON.stringify(payload));

    this.stompClient.publish({
      destination: '/pub/erd/table/move',
      headers: {},
      body: JSON.stringify(payload),
    });
  }

  /**
   * 테이블 이동 완료 전송 (드래그 완료)
   */
  sendTableMoveEnd(
    tableKey: number,
    xPosition: number,
    yPosition: number,
  ): void {
    if (!this.isConnected || !this.stompClient) {
      console.warn('Cannot send: WebSocket not connected');
      return;
    }

    const payload = {
      type: 'TABLE_MOVE',
      tableKey: tableKey,
      xPosition: xPosition,
      yPosition: yPosition,
    };

    console.log('📤 Sending TABLE_MOVE_END:', payload);

    this.stompClient.publish({
      destination: '/pub/erd/table/move/end',
      headers: {},
      body: JSON.stringify(payload),
    });
  }

  /**
   * 컬럼 순서 변경 전송
   */
  sendColumnReorder(columnKey: number, columnOrder: number): void {
    if (!this.isConnected || !this.stompClient) {
      console.warn('Cannot send: WebSocket not connected');
      return;
    }

    const payload: Omit<ColumnReorderEvent, 'type'> = {
      columnKey,
      columnOrder,
    };

    this.stompClient.publish({
      destination: '/pub/erd/column/reorder',
      body: JSON.stringify(payload),
    });
  }

  /**
   * 테이블 락 요청
   */
  sendTableLock(tableKey: number): void {
    if (!this.isConnected || !this.stompClient) {
      console.warn('Cannot send: WebSocket not connected');
      return;
    }

    const payload = {
      type: 'TABLE_LOCK',
      tableKey,
    };

    console.log('📤 Sending TABLE_LOCK:', payload);

    this.stompClient.publish({
      destination: '/pub/erd/table/lock',
      body: JSON.stringify(payload),
    });
  }

  /**
   * 테이블 락 해제
   */
  sendTableUnlock(tableKey: number): void {
    if (!this.isConnected || !this.stompClient) {
      console.warn('Cannot send: WebSocket not connected');
      return;
    }

    const payload = {
      type: 'TABLE_UNLOCK',
      tableKey,
    };

    console.log('📤 Sending TABLE_UNLOCK:', payload);

    this.stompClient.publish({
      destination: '/pub/erd/table/unlock',
      body: JSON.stringify(payload),
    });
  }

  // /**
  //  * 테이블 삭제 전송
  //  */
  // sendTableDelete(tableKey: number): void {
  //   if (!this.isConnected || !this.stompClient) {
  //     console.warn('Cannot send: WebSocket not connected');
  //     return;
  //   }

  //   const payload = {
  //     type: 'TABLE_DEL',
  //     tableKey,
  //   };

  //   console.log('📤 Sending TABLE_DELETE:', payload);

  //   this.stompClient.publish({
  //     destination: '/pub/erd/table/delete',
  //     body: JSON.stringify(payload),
  //   });
  // }

  /**
   * 커서 위치 전송
   */
  sendCursorMove(xPosition: number, yPosition: number): void {
    if (!this.isConnected || !this.stompClient) {
      return; // 커서는 조용히 무시
    }

    const payload: Omit<
      CursorMoveEvent,
      'type' | 'userEmail' | 'userName' | 'userColor'
    > = {
      projectKey: this.projectKey,
      xPosition,
      yPosition,
    };

    this.stompClient.publish({
      destination: '/pub/erd/cursor',
      body: JSON.stringify(payload),
    });
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * 연결 상태 확인
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 프로젝트 키 조회
   */
  getProjectKey(): number {
    return this.projectKey;
  }
}
