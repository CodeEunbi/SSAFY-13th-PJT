import uvicorn
import threading
import asyncio

class ServerManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.server = None
            cls._instance.thread = None
        return cls._instance
    
    def start_server(self):
        # 이미 실행 중이면 종료 후 재시작
        if self.server and self.thread and self.thread.is_alive():
            print("[INFO] Server already running. Restarting...")
            self.stop_server()
        
        config = uvicorn.Config(app, host="0.0.0.0", port=8000)
        self.server = uvicorn.Server(config)
        
        def run():
            asyncio.run(self.server.serve())
        
        self.thread = threading.Thread(target=run)
        self.thread.start()
        print("[INFO] RUNNING...")

# 이제 어디서 호출해도 같은 인스턴스
server_manager = ServerManager()  # 싱글톤

# 서버 시작
server_manager.start_server()

# 서버 종료
server_manager.stop_server()