// src/services/SimpleWebSocketService.ts

export interface TimerSyncMessage {
  type: 'TIMER_UPDATE' | 'TIMER_RESET' | 'SPEAKER_CHANGE' | 'MODE_CHANGE';
  roomId: string;
  countdown: number;
  currentSpeakerIndex: number;
  isPresentationActive: boolean;
  timestamp: number;
  sender: string;
}

export class SimpleWebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private myKey: string | null = null;
  private isHost: boolean = false;

  constructor() {
    // WebSocket 서버 URL (실제 환경에 맞게 수정 필요)
    this.ws = null;
  }

  // 연결
  connect(roomId: string, myKey: string, isHost: boolean = false): void {
    this.roomId = roomId;
    this.myKey = myKey;
    this.isHost = isHost;

    try {
      // 실제 WebSocket 서버가 없으므로 로컬 이벤트로 시뮬레이션
      console.log('WebSocket 연결 시뮬레이션:', { roomId, myKey, isHost });
      this.setupLocalEventSimulation();
      
      // 새로고침 시에도 동기화 상태 유지
      this.setupPersistence();
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
    }
  }

  // 새로고침 시에도 동기화 상태 유지
  private setupPersistence(): void {
    if (!this.roomId) return;
    
    // 현재 방의 동기화 상태를 localStorage에 저장
    const syncState = {
      roomId: this.roomId,
      myKey: this.myKey,
      isHost: this.isHost,
      lastConnected: Date.now(),
    };
    
    localStorage.setItem(`timer_sync_state_${this.roomId}`, JSON.stringify(syncState));
  }

  // 로컬 이벤트 시뮬레이션 (실제 WebSocket 대신)
  private setupLocalEventSimulation(): void {
    // 브라우저 탭 간 통신을 위한 localStorage 이벤트
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // 주기적 동기화 (호스트인 경우)
    if (this.isHost) {
      setInterval(() => {
        this.broadcastTimerState();
      }, 5000); // 5초마다
    }
  }

  // 타이머 상태 브로드캐스트
  private broadcastTimerState(): void {
    if (!this.isHost || !this.roomId || !this.myKey) return;

    // localStorage를 통해 다른 탭에 메시지 전달
    const message: TimerSyncMessage = {
      type: 'TIMER_UPDATE',
      roomId: this.roomId,
      countdown: 0, // 실제 값은 useTimer에서 설정
      currentSpeakerIndex: 0,
      isPresentationActive: false,
      timestamp: Date.now(),
      sender: this.myKey,
    };

    localStorage.setItem(`timer_sync_${this.roomId}`, JSON.stringify(message));
    localStorage.removeItem(`timer_sync_${this.roomId}`); // 즉시 제거하여 이벤트 발생
  }

  // 타이머 상태 업데이트 (호스트만)
  updateTimer(countdown: number, currentSpeakerIndex: number, isPresentationActive: boolean): void {
    if (!this.isHost || !this.roomId || !this.myKey) return;

    const message: TimerSyncMessage = {
      type: 'TIMER_UPDATE',
      roomId: this.roomId,
      countdown,
      currentSpeakerIndex,
      isPresentationActive,
      timestamp: Date.now(),
      sender: this.myKey,
    };

    // localStorage를 통해 메시지 전달
    localStorage.setItem(`timer_sync_${this.roomId}`, JSON.stringify(message));
    localStorage.removeItem(`timer_sync_${this.roomId}`);
  }

  // 발표자 변경 (호스트만)
  changeSpeaker(currentSpeakerIndex: number): void {
    if (!this.isHost || !this.roomId || !this.myKey) return;

    const message: TimerSyncMessage = {
      type: 'SPEAKER_CHANGE',
      roomId: this.roomId,
      countdown: 0,
      currentSpeakerIndex,
      isPresentationActive: true,
      timestamp: Date.now(),
      sender: this.myKey,
    };

    localStorage.setItem(`timer_sync_${this.roomId}`, JSON.stringify(message));
    localStorage.removeItem(`timer_sync_${this.roomId}`);
  }

  // 모드 변경 (호스트만)
  changeMode(isPresentationActive: boolean): void {
    if (!this.isHost || !this.roomId || !this.myKey) return;

    const message: TimerSyncMessage = {
      type: 'MODE_CHANGE',
      roomId: this.roomId,
      countdown: 0,
      currentSpeakerIndex: 0,
      isPresentationActive,
      timestamp: Date.now(),
      sender: this.myKey,
    };

    localStorage.setItem(`timer_sync_${this.roomId}`, JSON.stringify(message));
    localStorage.removeItem(`timer_sync_${this.roomId}`);
  }

  // 타이머 리셋 (호스트만)
  resetTimer(): void {
    if (!this.isHost || !this.roomId || !this.myKey) return;

    const message: TimerSyncMessage = {
      type: 'TIMER_RESET',
      roomId: this.roomId,
      countdown: 600,
      currentSpeakerIndex: 0,
      isPresentationActive: false,
      timestamp: Date.now(),
      sender: this.myKey,
    };

    localStorage.setItem(`timer_sync_${this.roomId}`, JSON.stringify(message));
    localStorage.removeItem(`timer_sync_${this.roomId}`);
  }

  // localStorage 변경 이벤트 처리
  private handleStorageChange(event: StorageEvent): void {
    if (!event.key || !event.key.startsWith('timer_sync_')) return;
    
    try {
      const message: TimerSyncMessage = JSON.parse(event.newValue || '{}');
      
      // 자신이 보낸 메시지는 무시
      if (message.sender === this.myKey) return;
      
      // 메시지가 너무 오래된 경우 무시 (1초 이상)
      if (Date.now() - message.timestamp > 1000) return;
      
      // 이벤트 발생
      const customEvent = new CustomEvent('timerSync', { detail: message });
      window.dispatchEvent(customEvent);
    } catch (error) {
      console.error('메시지 파싱 실패:', error);
    }
  }

  // 정리
  cleanup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // 이벤트 리스너 제거
    window.removeEventListener('storage', this.handleStorageChange.bind(this));

    // 동기화 상태 제거 (방을 완전히 나갈 때만)
    if (this.roomId) {
      localStorage.removeItem(`timer_sync_state_${this.roomId}`);
    }

    this.roomId = null;
    this.myKey = null;
    this.isHost = false;
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
