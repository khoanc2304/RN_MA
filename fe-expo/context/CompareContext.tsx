import React, { createContext, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Product } from '../screens/HomeScreen';

interface CompareContextType {
  compareList: Product[];
  toggleCompare: (product: Product) => void;
  compareModalVisible: boolean;
  setCompareModalVisible: (visible: boolean) => void;
}

export const CompareContext = createContext<CompareContextType>({
  compareList: [],
  toggleCompare: () => {},
  compareModalVisible: false,
  setCompareModalVisible: () => {},
});

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [compareModalVisible, setCompareModalVisible] = useState(false);

  const toggleCompare = (product: Product) => {
    if (compareList.find(p => p._id === product._id)) {
      setCompareList(compareList.filter(p => p._id !== product._id));
    } else {
      if (compareList.length >= 3) {
        Alert.alert('Giới hạn so sánh', 'Bạn chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc.');
        return;
      }
      setCompareList([...compareList, product]);
    }
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        toggleCompare,
        compareModalVisible,
        setCompareModalVisible,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};
