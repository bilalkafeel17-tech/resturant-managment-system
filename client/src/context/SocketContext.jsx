import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { initSocket, disconnectSocket, getSocket } from '../services/socket.js';
import { useToast } from './ToastContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, restaurant, activeBranch } = useAuth();
  const toast = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || !restaurant) {
      disconnectSocket();
      setIsConnected(false);
      return;
    }

    const socketInstance = initSocket(restaurant._id, activeBranch?._id);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    // Global listener for live order notifications
    const onOrderCreated = (data) => {
      // If user is kitchen staff or cashier, play subtle chime / show notification
      if (user.role === 'kitchen' || user.role === 'cashier' || user.role === 'admin') {
        toast.info(`New Order #${data.order?.orderNumber} received!`, 'Incoming Order');
      }
    };

    const onOrderStatusUpdated = (data) => {
      if (data.status === 'ready' && (user.role === 'cashier' || user.role === 'admin')) {
        toast.success(`Order #${data.orderNumber} is READY to serve!`, 'Kitchen Update');
      }
    };

    socketInstance.on('order_created', onOrderCreated);
    socketInstance.on('order_status_updated', onOrderStatusUpdated);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('order_created', onOrderCreated);
      socketInstance.off('order_status_updated', onOrderStatusUpdated);
    };
  }, [user, restaurant, activeBranch, toast]);

  return (
    <SocketContext.Provider value={{ isConnected, socket: getSocket() }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context || { isConnected: false, socket: null };
};
