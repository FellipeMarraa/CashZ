import {useEffect} from 'react';
import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useNotificationSocket(userId: string, onNewNotification: (notification: any) => void) {

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws-notifications');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            client.subscribe(`/topic/notifications/${userId}`, (msg) => {
                try {
                    const notification = JSON.parse(msg.body);
                    onNewNotification(notification);
                } catch (error) {
                    console.error('Erro ao parsear mensagem do WebSocket:', error);
                }
            });
        };


        client.onStompError = (frame) => {
            console.error('Broker reportou erro: ' + frame.headers['message']);
            console.error('Detalhes adicionais: ' + frame.body);
        };

        client.onWebSocketError = (event) => {
            console.error('Erro no WebSocket', event);
        };

        client.activate();

        return () => {
            client.deactivate();
        };

    }, [userId]);

}
