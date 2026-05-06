import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth.js';

export const useSocket = () => {
  const { token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  return socketRef.current;
};