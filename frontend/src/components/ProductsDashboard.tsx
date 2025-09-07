import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../types';
import Modal from './common/Modal';
import ProductForm from './ProductForm';
import ProductsTable from './ProductsTable';
import Button from './common/Button';
import ConfirmationDialog from './common/ConfirmationDialog';
import InventoryAnalytics from './InventoryAnalytics';
const ProductsDashboard: React.FC = () => {
  const { modal } = useSelector((state: RootState) => state);
  const {
    products,
    statistics,
    isLoading,
    error,
    isCreating,
    isUpdating,
    currentPage,
    totalPages,
    totalProducts,
    pageSize,
    handleCreateProduct,
    handleEditProduct,
    handleCloseModal,
    handleCreate,
    handleUpdate,
    handleDelete,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  } = useProducts();

  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

  const handleFormSubmit = async (data: any) => {
    if (modal.mode === 'create') {
      return await handleCreate(data);
    } else if (modal.mode === 'edit' && modal.product) {
      return await handleUpdate(modal.product.id, data);
    }
    return { success: false, error: 'Invalid form submission' };
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteProduct(product);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;

    setIsDeletingProduct(true);
    const result = await handleDelete(deleteProduct.id);
    setIsDeletingProduct(false);

    if (result.success) {
      setDeleteProduct(null);
    }
    // Error handling is now done in the hook with notifications
  };

  const handleDeleteCancel = () => {
    setDeleteProduct(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Manage your product inventory with AI-powered insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'analytics'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  AI Analytics
                </button>
              </div>
              <Button onClick={handleCreateProduct} size="large">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Products
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      In Stock
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.inStock}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Low Stock
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.lowStock}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Out of Stock
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics.outOfStock}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Loading products...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-red-600 mb-2">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium">Failed to load products</h3>
                  <p className="text-sm text-red-500 mt-2">
                    Unable to connect to the server. Please check your connection and try again.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Products Table */}
            {!isLoading && !error && (
              <ProductsTable
                products={products}
                loading={isLoading}
                onEdit={handleEditProduct}
                onDelete={handleDeleteClick}
                onSelect={setSelectedProduct}
                selectedProduct={selectedProduct}
                currentPage={currentPage}
                totalPages={totalPages}
                totalProducts={totalProducts}
                pageSize={pageSize}
                onPageChange={goToPage}
                onPreviousPage={goToPreviousPage}
                onNextPage={goToNextPage}
              />
            )}
          </div>
        ) : (
          <InventoryAnalytics />
        )}

        {/* Product Form Modal */}
        <Modal
          isOpen={modal.isOpen}
          onClose={handleCloseModal}
          title={modal.mode === 'create' ? 'Add New Product' : 'Edit Product'}
          size="medium"
        >
          <ProductForm
            product={modal.product}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseModal}
            loading={isCreating || isUpdating}
          />
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={!!deleteProduct}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteProduct?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={isDeletingProduct}
        />
      </div>
    </div>
  );
};

export default ProductsDashboard;
