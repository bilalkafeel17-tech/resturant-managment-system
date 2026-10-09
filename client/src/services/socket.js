import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket = null;

export const initSocket = (restaurantId, branchId) => {
  if (socket && socket.connected) {
    socket.emit('join_branch', { restaurantId, branchId });
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to real-time server:', socket.id);
    if (restaurantId) {
      socket.emit('join_branch', { restaurantId, branchId });
    }
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Real-time connection notice:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
