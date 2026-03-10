import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { Product } from '../screens/HomeScreen';

export interface CartItem {
  product: Product;
  quantity: number;
  size: number;
  selected?: boolean; // Thêm trạng thái chọn
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, size: number, quantity?: number) => void;
  removeFromCart: (productId: string, size: number) => void;
  increaseQuantity: (productId: string, size: number) => void;
  decreaseQuantity: (productId: string, size: number) => void;
  toggleSelectItem: (productId: string, size: number) => void; // Chọn món
  toggleSelectAll: (isSelected: boolean) => void; // Chọn tất cả
  removeSelectedItems: () => void; // Xoá những món đã mua
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
  selectedTotalPrice: number; // Tổng tiền các món đang được chọn
  selectedTotalItems: number; // Tổng số lượng các món đang được chọn
}

export const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  increaseQuantity: () => {},
  decreaseQuantity: () => {},
  toggleSelectItem: () => {},
  toggleSelectAll: () => {},
  removeSelectedItems: () => {},
  clearCart: () => {},
  totalPrice: 0,
  totalItems: 0,
  selectedTotalPrice: 0,
  selectedTotalItems: 0,
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
            const parsed = JSON.parse(storedCart);
            // Đảm bảo các item cũ cũng có trường selected mặc định là true
            const normalized = parsed.map((item: CartItem) => ({
              ...item,
              selected: item.selected !== undefined ? item.selected : true
            }));
            setCartItems(normalized);
          } else {
            setCartItems([]);
          }
        } catch (error) {
          console.log('Lỗi load cart từ AsyncStorage:', error);
        }
      } else {
        setCartItems([]);
      }
    };
    loadCartData();
  }, [userInfo]);

  // Save cart mỗi khi có sự thay đổi
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
      
      let updatedCart: CartItem[] = [];
      if (existingItem) {
        if (existingItem.quantity + quantity > stock) {
          Alert.alert('Hết hàng', `Rất tiếc, size ${size} chỉ còn ${stock} đôi trong kho.`);
          return prev;
        }
        updatedCart = prev.map(item =>
          item.product._id === product._id && item.size === size
            ? { ...item, quantity: item.quantity + quantity, selected: true } // Luôn chọn khi add thêm
            : item
        );
      } else {
        if (quantity > stock) {
          Alert.alert('Hết hàng', `Rất tiếc, size ${size} chỉ còn ${stock} đôi trong kho.`);
          return prev;
        }
        updatedCart = [...prev, { product, quantity, size, selected: true }];
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
          return { ...item, quantity: item.quantity + 1, selected: true }; // Tự động chọn lại nếu tăng số lượng
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

  const toggleSelectItem = (productId: string, size: number) => {
    setCartItems(prev => {
      const updatedCart = prev.map(item => 
        item.product._id === productId && item.size === size
          ? { ...item, selected: !item.selected }
          : item
      );
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const toggleSelectAll = (isSelected: boolean) => {
    setCartItems(prev => {
      const updatedCart = prev.map(item => ({ ...item, selected: isSelected }));
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const removeSelectedItems = () => {
    setCartItems(prev => {
      const updatedCart = prev.filter(item => !item.selected);
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToStorage([]);
  };

  // Tính toán các thông số tổng
  const totalPrice = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const selectedTotalPrice = cartItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
  const selectedTotalItems = cartItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        toggleSelectItem,
        toggleSelectAll,
        removeSelectedItems,
        clearCart,
        totalPrice,
        totalItems,
        selectedTotalPrice,
        selectedTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
