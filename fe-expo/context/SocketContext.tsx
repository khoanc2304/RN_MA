import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { SOCKET_URL } from '../services/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userInfo } = useContext(AuthContext);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (userInfo?._id) {
      // Kết nối socket nếu chưa có hoặc đã bị ngắt
      if (!socketRef.current) {
        socketRef.current = io(SOCKET_URL);
        setSocket(socketRef.current);

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          console.log('🚀 Global Socket Connected');
          socketRef.current?.emit('join', userInfo._id);
        });

        socketRef.current.on('disconnect', () => {
          setIsConnected(false);
          console.log('❌ Global Socket Disconnected');
        });
      } else {
        // Nếu đã có socket mà userInfo thay đổi (vừa login)
        socketRef.current.emit('join', userInfo._id);
      }
    } else {
      // Nếu logout, ngắt kết nối
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      // Không ngắt kết nối ở đây để giữ persistent connection xuyên suốt app
      // Chỉ ngắt khi Provider bị unmount (thường là khi đóng app)
    };
  }, [userInfo?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
