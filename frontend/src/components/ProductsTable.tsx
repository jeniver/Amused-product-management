import React from 'react';
import { Product, TableColumn } from '../types';
import Table from './common/Table';
import Button from './common/Button';
import Pagination from './common/Pagination';

interface ProductsTableProps {
  products: Product[];
  loading?: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onSelect?: (product: Product) => void;
  selectedProduct?: Product | null;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalProducts?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading = false,
  onEdit,
  onDelete,
  onSelect,
  selectedProduct,
  currentPage = 1,
  totalPages = 1,
  totalProducts = 0,
  pageSize = 20,
  onPageChange,
  onPreviousPage,
  onNextPage,
}) => {
  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) {
      return '$0.00';
    }
    
    // Convert string to number if needed
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numericPrice)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericPrice);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getQuantityStatus = (quantity: number | undefined | null) => {
    const qty = quantity ?? 0;
    if (qty === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    } else if (qty <= 5) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Low Stock ({qty})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          In Stock ({qty})
        </span>
      );
    }
  };

  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, product) => (
        <div>
          <div className="font-medium text-gray-900">{value || 'N/A'}</div>
          {product.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {product.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">
          {formatPrice(value)}
        </span>
      ),
    },
    {
      key: 'quantity',
      label: 'Stock',
      sortable: true,
      render: (value) => getQuantityStatus(value),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-500">
          {formatDate(value)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, product) => (
        <div className="flex space-x-2">
          <Button
            size="small"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <Table
        data={products}
        columns={columns}
        loading={loading}
        emptyMessage="No products found. Click 'Add Product' to get started."
      />
      {onPageChange && onPreviousPage && onNextPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalProducts}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      )}
    </div>
  );
};

export default ProductsTable;
