import { useState } from 'react';
import type { Product } from '../../models/product.types';

type UseProductsParams = {
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clearProductFromCart: (productId: string) => void;
};

export const useProducts = ({ setProducts, clearProductFromCart }: UseProductsParams) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productBeingEdited, setProductBeingEdited] = useState<Product | undefined>();

  const handleOpenAddProduct = () => {
    setProductBeingEdited(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductBeingEdited(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const shouldDelete = window.confirm(
      'Tem certeza que deseja eliminar este produto? Se este produto estiver no carrinho, será removido.'
    );
    if (!shouldDelete) return;

    setProducts((current) => current.filter((product) => product.id !== productId));
    clearProductFromCart(productId);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id'>) => {
    if (productBeingEdited) {
      setProducts((current) =>
        current.map((product) =>
          product.id === productBeingEdited.id ? { ...product, ...productData } : product
        )
      );
    } else {
      const newProduct: Product = { id: crypto.randomUUID(), ...productData };
      setProducts((current) => [newProduct, ...current]);
    }
    setIsModalOpen(false);
    setProductBeingEdited(undefined);
  };

  const handleImportProducts = (imported: Omit<Product, 'id'>[], replace: boolean) => {
    const newProducts = imported.map((p) => ({ id: crypto.randomUUID(), ...p }));
    setProducts((current) => (replace ? newProducts : [...current, ...newProducts]));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductBeingEdited(undefined);
  };

  return {
    isModalOpen,
    productBeingEdited,
    handleOpenAddProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleSaveProduct,
    handleImportProducts,
    handleCloseModal,
  };
};
