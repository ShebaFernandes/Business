import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import productService, { Product } from '../../services/productService';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  Edit, 
  Trash2,
  Eye,
  TrendingUp,
  AlertCircle,
  X,
  Save,
  DollarSign,
  Box,
  Image as ImageIcon
} from 'lucide-react';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: string;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  image: ''
};

const categories = [
  'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 
  'Health & Beauty', 'Toys', 'Automotive', 'Food & Beverage', 'Accessories'
];

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products when search or status changes
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedStatus]);

  const loadProducts = async () => {
    try {
      const productList = await productService.getAllProducts();
      setProducts(productList);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(product => product.status === selectedStatus);
    }

    setFilteredProducts(filtered);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    if (!formData.stock.trim()) {
      newErrors.stock = 'Stock is required';
    } else if (isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
      newErrors.stock = 'Stock must be a valid non-negative number';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category.trim(),
        image: formData.image.trim() || `https://images.pexels.com/photos/4173624/pexels-photo-4173624.jpeg?auto=compress&cs=tinysrgb&w=400`
      };

      const userContext = user ? {
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      } : undefined;

      if (editingProduct) {
        // Update existing product
        const updatedProduct = await productService.updateProduct(editingProduct.id, productData, userContext);
        if (updatedProduct) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
        }
      } else {
        // Create new product
        const newProduct = await productService.createProduct(productData, userContext);
        setProducts(prev => [...prev, newProduct]);
      }

      resetForm();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    }
    setIsLoading(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
      image: product.image || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const userContext = user ? {
        userId: user.id,
        userName: user.name,
        userEmail: user.email
      } : undefined;

      const success = await productService.deleteProduct(product.id, userContext);
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== product.id));
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProduct(null);
    setErrors({});
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <TrendingUp className="w-4 h-4" />;
      case 'low_stock':
        return <AlertCircle className="w-4 h-4" />;
      case 'inactive':
        return <Package className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Product Form Modal Component
  const ProductModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Product Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                    error={errors.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
                      errors.description ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Price *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={e => handleInputChange('price', e.target.value)}
                      placeholder="0.00"
                      error={errors.price}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Box className="w-4 h-4 inline mr-1" />
                      Stock *
                    </label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={e => handleInputChange('stock', e.target.value)}
                      placeholder="0"
                      error={errors.stock}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => handleInputChange('category', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      errors.category ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    Image URL
                  </label>
                  <Input
                    type="url"
                    value={formData.image}
                    onChange={e => handleInputChange('image', e.target.value)}
                    placeholder="https://example.com/image.jpg (optional)"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button 
          variant="primary" 
          className="flex items-center space-x-2"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </Button>
      </motion.div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="low_stock">Low Stock</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {getStatusIcon(product.status)}
                    <span className="capitalize">{product.status.replace('_', ' ')}</span>
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                    {product.name}
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">${product.price}</p>
                    <p className="text-sm text-gray-500">Stock: {product.stock} units</p>
                  </div>
                  {product.category && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Updated {formatRelativeTime(product.lastUpdated)}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" title="View Details">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Edit Product"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Delete Product"
                      onClick={() => handleDelete(product)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || selectedStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by adding your first product'
            }
          </p>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </motion.div>
      )}

      {/* Add Product Modal */}
      <ProductModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Product" 
      />

      {/* Edit Product Modal */}
      <ProductModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Product" 
      />
    </div>
  );
};