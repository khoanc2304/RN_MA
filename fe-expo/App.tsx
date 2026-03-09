import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import AppNavigator from './navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
