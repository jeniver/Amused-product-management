import { useCallback, useMemo, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { openCreateModal, openEditModal, closeModal } from '../store/slices/modalSlice';
import { CreateProductRequest, UpdateProductRequest, Product } from '../types';
import { useErrorHandler } from './useErrorHandler';
import { useToast } from '../contexts/ToastContext';
import { config } from '../config';
import apiService from '../services/apiService';

export const useProducts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { handleError } = useErrorHandler();
  const { showToast } = useToast();
  
  // Local state for products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(20); // Fixed at 20 rows per page

  const loadProducts = useCallback(async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAllProducts(page, pageSize);
      console.log('Loaded products:', response);
      setProducts(response.products);
      setTotalPages(response.totalPages);
      setTotalProducts(response.total);
      setCurrentPage(response.page);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to load products:', error);
      showToast(`Failed to load products: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, showToast]);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Memoized statistics
  const statistics = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.quantity > config.LOW_STOCK_THRESHOLD).length;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= config.LOW_STOCK_THRESHOLD).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;

    return { total, inStock, lowStock, outOfStock };
  }, [products]);

  // Modal actions
  const handleCreateProduct = useCallback(() => {
    dispatch(openCreateModal());
  }, [dispatch]);

  const handleEditProduct = useCallback((product: Product) => {
    dispatch(openEditModal(product));
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    dispatch(closeModal());
  }, [dispatch]);

  // Product CRUD operations
  const handleCreate = useCallback(async (productData: CreateProductRequest) => {
    try {
      setIsCreating(true);
      const newProduct = await apiService.createProduct(productData);
      console.log('Created product:', newProduct);
      
      // Refresh the products list to get the latest data from the server
      await loadProducts();
      
      dispatch(closeModal());
      showToast('Product created successfully!', 'success');
      return { success: true };
    } catch (error) {
      const errorMessage = handleError(error, {
        showNotification: false,
        fallbackMessage: 'Failed to create product',
      });
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  }, [dispatch, handleError, showToast, loadProducts]);

  const handleUpdate = useCallback(async (id: number, updates: UpdateProductRequest) => {
    try {
      setIsUpdating(true);
      const updatedProduct = await apiService.updateProduct(id, updates);
      console.log('Updated product:', updatedProduct);
      
      // Refresh the products list to get the latest data from the server
      await loadProducts();
      
      dispatch(closeModal());
      showToast('Product updated successfully!', 'success');
      return { success: true };
    } catch (error) {
      const errorMessage = handleError(error, {
        showNotification: false,
        fallbackMessage: 'Failed to update product',
      });
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, handleError, showToast, loadProducts]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      setIsDeleting(true);
      const response = await apiService.deleteProduct(id);
      
      if (response.success) {
        // Optimistically update the UI
        setProducts(prev => prev.filter(product => product.id !== id));
        
        // Update statistics immediately
        const updatedStats = { ...statistics };
        const deletedProduct = products.find(p => p.id === id);
        if (deletedProduct) {
          updatedStats.total--;
          if (deletedProduct.quantity === 0) updatedStats.outOfStock--;
          else if (deletedProduct.quantity <= config.LOW_STOCK_THRESHOLD) updatedStats.lowStock--;
          else updatedStats.inStock--;
        }
        
        // Show success message
        showToast('Product deleted successfully!', 'success');
        
        // Refresh the data in background
        loadProducts().catch(console.error);
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (error) {
      const errorMessage = handleError(error, {
        showNotification: false,
        fallbackMessage: 'Failed to delete product',
      });
      showToast(errorMessage, 'error');
      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  }, [handleError, showToast, loadProducts, products, statistics]);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadProducts(page);
    }
  }, [totalPages, loadProducts]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  return {
    // Data
    products,
    statistics,
    isLoading,
    error,
    
    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    
    // Pagination data
    currentPage,
    totalPages,
    totalProducts,
    pageSize,
    
    // Actions
    handleCreateProduct,
    handleEditProduct,
    handleCloseModal,
    handleCreate,
    handleUpdate,
    handleDelete,
    
    // Pagination actions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    
    refetch: loadProducts,
  };
};
