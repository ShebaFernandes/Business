/**
 * Product Management Service
 * Handles CRUD operations for products and syncs with n8n/Google Sheets
 */

import webhookService from './webhookService';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'low_stock';
  category?: string;
  image?: string;
  lastUpdated: string;
  createdAt: string;
}

class ProductService {
  private products: Product[] = [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
      price: 199.99,
      stock: 15,
      status: 'active',
      category: 'Electronics',
      image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400',
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      name: 'Smart Fitness Watch',
      description: 'Advanced fitness tracking with heart rate monitoring and GPS',
      price: 299.99,
      stock: 3,
      status: 'low_stock',
      category: 'Wearables',
      image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=400',
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      name: 'Portable Power Bank',
      description: '20,000mAh fast-charging portable battery with wireless charging',
      price: 79.99,
      stock: 0,
      status: 'inactive',
      category: 'Accessories',
      image: 'https://images.pexels.com/photos/4526414/pexels-photo-4526414.jpeg?auto=compress&cs=tinysrgb&w=400',
      lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Determine product status based on stock
  private determineStatus(stock: number): Product['status'] {
    if (stock === 0) return 'inactive';
    if (stock <= 5) return 'low_stock';
    return 'active';
  }

  // Get all products
  async getAllProducts(): Promise<Product[]> {
    return [...this.products];
  }

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    return this.products.find(product => product.id === id) || null;
  }

  // Create new product
  async createProduct(
    productData: Omit<Product, 'id' | 'lastUpdated' | 'createdAt' | 'status'>,
    userContext?: { userId: string; userName: string; userEmail: string }
  ): Promise<Product> {
    const newProduct: Product = {
      ...productData,
      id: this.generateId(),
      status: this.determineStatus(productData.stock),
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.products.push(newProduct);

    // Send to n8n webhook for Google Sheets sync
    try {
      await webhookService.sendProductData({
        action: 'create',
        product: {
          id: newProduct.id,
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          stock: newProduct.stock,
          status: newProduct.status,
          category: newProduct.category
        },
        ...userContext
      });
    } catch (error) {
      console.error('Failed to sync product creation to Google Sheets:', error);
    }

    return newProduct;
  }

  // Update existing product
  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt'>>,
    userContext?: { userId: string; userName: string; userEmail: string }
  ): Promise<Product | null> {
    const productIndex = this.products.findIndex(product => product.id === id);
    
    if (productIndex === -1) {
      return null;
    }

    const existingProduct = this.products[productIndex];
    const previousValues = { ...existingProduct };

    // Update status based on stock if stock is being updated
    if (updates.stock !== undefined) {
      updates.status = this.determineStatus(updates.stock);
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    this.products[productIndex] = updatedProduct;

    // Send to n8n webhook for Google Sheets sync
    try {
      await webhookService.sendProductData({
        action: 'update',
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          stock: updatedProduct.stock,
          status: updatedProduct.status,
          category: updatedProduct.category
        },
        previousValues: {
          id: previousValues.id,
          name: previousValues.name,
          description: previousValues.description,
          price: previousValues.price,
          stock: previousValues.stock,
          status: previousValues.status,
          category: previousValues.category
        },
        ...userContext
      });
    } catch (error) {
      console.error('Failed to sync product update to Google Sheets:', error);
    }

    return updatedProduct;
  }

  // Delete product
  async deleteProduct(
    id: string,
    userContext?: { userId: string; userName: string; userEmail: string }
  ): Promise<boolean> {
    const productIndex = this.products.findIndex(product => product.id === id);
    
    if (productIndex === -1) {
      return false;
    }

    const deletedProduct = this.products[productIndex];
    this.products.splice(productIndex, 1);

    // Send to n8n webhook for Google Sheets sync
    try {
      await webhookService.sendProductData({
        action: 'delete',
        product: {
          id: deletedProduct.id,
          name: deletedProduct.name,
          description: deletedProduct.description,
          price: deletedProduct.price,
          stock: deletedProduct.stock,
          status: deletedProduct.status,
          category: deletedProduct.category
        },
        ...userContext
      });
    } catch (error) {
      console.error('Failed to sync product deletion to Google Sheets:', error);
    }

    return true;
  }

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    if (!query.trim()) {
      return this.getAllProducts();
    }

    const lowercaseQuery = query.toLowerCase();
    return this.products.filter(product =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.category?.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Filter products by status
  async filterByStatus(status: Product['status']): Promise<Product[]> {
    return this.products.filter(product => product.status === status);
  }

  // Get products with low stock
  async getLowStockProducts(): Promise<Product[]> {
    return this.products.filter(product => product.stock <= 5);
  }

  // Get product statistics
  async getProductStats(): Promise<{
    total: number;
    active: number;
    lowStock: number;
    inactive: number;
    totalValue: number;
  }> {
    const stats = this.products.reduce(
      (acc, product) => {
        acc.total += 1;
        acc.totalValue += product.price * product.stock;
        
        switch (product.status) {
          case 'active':
            acc.active += 1;
            break;
          case 'low_stock':
            acc.lowStock += 1;
            break;
          case 'inactive':
            acc.inactive += 1;
            break;
        }
        
        return acc;
      },
      { total: 0, active: 0, lowStock: 0, inactive: 0, totalValue: 0 }
    );

    return stats;
  }
}

export const productService = new ProductService();
export default productService;