import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class ChatRealtimeClient {
  constructor() {
    this.client = null;
    this.listeners = {
      chat: new Set(),
      call: new Set(),
      presence: new Set(),
    };
  }

  connect() {
    if (this.client?.active) {
      return this.client;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(`/ws?token=${encodeURIComponent(token)}`),
      reconnectDelay: 3000,
    });

    this.client.onConnect = () => {
      this.client.subscribe('/user/queue/chat', message => {
        this.emit('chat', JSON.parse(message.body));
      });
      this.client.subscribe('/user/queue/call', message => {
        this.emit('call', JSON.parse(message.body));
      });
      this.client.subscribe('/topic/presence', message => {
        this.emit('presence', JSON.parse(message.body));
      });
      this.publish('/app/chat.presence', {});
    };

    this.client.activate();
    return this.client;
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  subscribe(channel, handler) {
    this.listeners[channel]?.add(handler);
    return () => this.listeners[channel]?.delete(handler);
  }

  emit(channel, payload) {
    this.listeners[channel]?.forEach(listener => listener(payload));
  }

  publish(destination, body) {
    if (!this.client?.connected) {
      return;
    }

    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }
}

const chatRealtime = new ChatRealtimeClient();

export default chatRealtime;
