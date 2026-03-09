import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { Product } from '../screens/HomeScreen';

export interface CartItem {
  product: Product;
  quantity: number;
  size: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, size: number, quantity?: number) => void;
  removeFromCart: (productId: string, size: number) => void;
  increaseQuantity: (productId: string, size: number) => void;
  decreaseQuantity: (productId: string, size: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  increaseQuantity: () => {},
  decreaseQuantity: () => {},
  clearCart: () => {},
  totalPrice: 0,
  totalItems: 0,
});

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { userInfo } = useContext(AuthContext);

  // Load cart khi login thành công (khi có userInfo)
  useEffect(() => {
    const loadCartData = async () => {
      if (userInfo && userInfo._id) {
        try {
          const storedCart = await AsyncStorage.getItem(`cart_${userInfo._id}`);
          if (storedCart) {
            setCartItems(JSON.parse(storedCart));
          } else {
            setCartItems([]);
          }
        } catch (error) {
          console.log('Lỗi load cart từ AsyncStorage:', error);
        }
      } else {
        // Khi logout (userInfo null) -> Xoá khỏi Context
        setCartItems([]);
      }
    };
    loadCartData();
  }, [userInfo]);

  // Save cart mỗi khi có sự thay đổi (Add, remove, clear, v.v...)
  const saveCartToStorage = async (newCart: CartItem[]) => {
    if (userInfo && userInfo._id) {
      try {
        await AsyncStorage.setItem(`cart_${userInfo._id}`, JSON.stringify(newCart));
      } catch (error) {
        console.log('Lỗi save cart vào AsyncStorage:', error);
      }
    }
  };

  const addToCart = (product: Product, size: number, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product._id === product._id && item.size === size);
      
      const sizeInfo = product.sizes?.find(s => s.size === size);
      const stock = sizeInfo ? sizeInfo.stock : 0;
      
      let updatedCart = [...prev];
      if (existingItem) {
        if (existingItem.quantity + quantity > stock) {
          Alert.alert('Hết hàng', `Rất tiếc, size ${size} chỉ còn ${stock} đôi trong kho.`);
          return prev;
        }
        updatedCart = prev.map(item =>
          item.product._id === product._id && item.size === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        if (quantity > stock) {
          Alert.alert('Hết hàng', `Rất tiếc, size ${size} chỉ còn ${stock} đôi trong kho.`);
          return prev;
        }
        updatedCart = [...prev, { product, quantity, size }];
      }

      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const removeFromCart = (productId: string, size: number) => {
    setCartItems(prev => {
      const updatedCart = prev.filter(item => !(item.product._id === productId && item.size === size));
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const increaseQuantity = (productId: string, size: number) => {
    setCartItems(prev => {
      const updatedCart = prev.map(item => {
        if (item.product._id === productId && item.size === size) {
          const sizeInfo = item.product.sizes?.find(s => s.size === size);
          const stock = sizeInfo ? sizeInfo.stock : 0;
          
          if (item.quantity + 1 > stock) {
            Alert.alert('Hết hàng', `Rất tiếc, size ${size} chỉ còn ${stock} đôi trong kho.`);
            return item;
          }
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const decreaseQuantity = (productId: string, size: number) => {
    setCartItems(prev => {
      const updatedCart = prev.map(item => {
        if (item.product._id === productId && item.size === size && item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      });
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToStorage([]); // Làm rỗng cart trên storage
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalPrice,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
