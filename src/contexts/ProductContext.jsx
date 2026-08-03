import { createContext, useEffect, useState } from "react";

const ProductContext = createContext();

const ProductProvider = ({ children }) => {
  const [selectedProduct, setSelectedProduct] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("selectedProduct")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const storedProduct = JSON.parse(sessionStorage.getItem("selectedProduct"));
    console.log("ProductContext loading from sessionStorage:", storedProduct);
    console.log("ProductContext selectedPlanType:", storedProduct?.selectedPlanType);
    setSelectedProduct(storedProduct);
  }, []);

  return (
    <ProductContext.Provider value={{ selectedProduct, setSelectedProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export { ProductContext, ProductProvider };
