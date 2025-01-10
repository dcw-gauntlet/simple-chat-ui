interface Heartbeat {
    user_id: string;
}

export class UserPresence {
    private ws: WebSocket;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
        this.ws = new WebSocket('ws://venus:8887');
        this.setupWebSocket();
    }

    private setupWebSocket() {
        this.ws.onopen = () => {
            console.log('Connected to presence server');
            this.startHeartbeat();
        };

        this.ws.onclose = (event) => {
            console.log('Disconnected from presence server - code:', event.code, 'reason:', event.reason);
            this.stopHeartbeat();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error - full details:', {
                readyState: this.ws.readyState,
                error: error
            });
        };
    }

    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const heartbeat: Heartbeat = {
                user_id: this.userId
            };
            this.ws.send(JSON.stringify(heartbeat));
        }, 1000); 
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    public disconnect() {
        this.stopHeartbeat();
        this.ws.close();
    }
}
