const axios = require('axios');

class ShopifyService {
  constructor() {
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    this.apiKey = process.env.SHOPIFY_API_KEY;
    this.apiSecret = process.env.SHOPIFY_API_SECRET;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.apiVersion = '2023-10';
    
    this.baseURL = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  // Get customer by ID
  async getCustomer(customerId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/customers/${customerId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.customer;
    } catch (error) {
      console.error('Error fetching customer:', error.response?.data || error.message);
      throw new Error('Failed to fetch customer from Shopify');
    }
  }

  // Get customer orders
  async getCustomerOrders(customerId, limit = 10) {
    try {
      const response = await axios.get(
        `${this.baseURL}/customers/${customerId}/orders.json?limit=${limit}&status=any`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.orders;
    } catch (error) {
      console.error('Error fetching customer orders:', error.response?.data || error.message);
      throw new Error('Failed to fetch customer orders from Shopify');
    }
  }

  // Get products
  async getProducts(limit = 50, page = 1) {
    try {
      const response = await axios.get(
        `${this.baseURL}/products.json?limit=${limit}&page=${page}`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.products;
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw new Error('Failed to fetch products from Shopify');
    }
  }

  // Get product by ID
  async getProduct(productId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/products/${productId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.product;
    } catch (error) {
      console.error('Error fetching product:', error.response?.data || error.message);
      throw new Error('Failed to fetch product from Shopify');
    }
  }

  // Get product recommendations based on customer data
  async getProductRecommendations(customerId, limit = 10) {
    try {
      // Get customer's order history
      const orders = await this.getCustomerOrders(customerId, 20);
      
      // Extract product IDs from orders
      const purchasedProductIds = new Set();
      orders.forEach(order => {
        order.line_items.forEach(item => {
          purchasedProductIds.add(item.product_id.toString());
        });
      });

      // Get all products
      const allProducts = await this.getProducts(100);
      
      // Filter out already purchased products and get recommendations
      const recommendations = allProducts
        .filter(product => !purchasedProductIds.has(product.id.toString()))
        .slice(0, limit)
        .map(product => ({
          id: product.id,
          title: product.title,
          handle: product.handle,
          description: product.body_html,
          price: product.variants[0]?.price || '0',
          image: product.images[0]?.src || null,
          tags: product.tags.split(',').map(tag => tag.trim()),
          vendor: product.vendor,
          product_type: product.product_type,
          created_at: product.created_at,
          updated_at: product.updated_at
        }));

      return recommendations;
    } catch (error) {
      console.error('Error getting product recommendations:', error);
      throw new Error('Failed to get product recommendations');
    }
  }

  // Get products by category/tags
  async getProductsByCategory(category, limit = 20) {
    try {
      const response = await axios.get(
        `${this.baseURL}/products.json?product_type=${encodeURIComponent(category)}&limit=${limit}`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.products.map(product => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.body_html,
        price: product.variants[0]?.price || '0',
        image: product.images[0]?.src || null,
        tags: product.tags.split(',').map(tag => tag.trim()),
        vendor: product.vendor,
        product_type: product.product_type
      }));
    } catch (error) {
      console.error('Error fetching products by category:', error.response?.data || error.message);
      throw new Error('Failed to fetch products by category from Shopify');
    }
  }

  // Get trending products (based on recent orders)
  async getTrendingProducts(limit = 10) {
    try {
      // Get recent orders
      const response = await axios.get(
        `${this.baseURL}/orders.json?limit=50&status=any&created_at_min=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      // Count product popularity
      const productCounts = {};
      response.data.orders.forEach(order => {
        order.line_items.forEach(item => {
          const productId = item.product_id.toString();
          productCounts[productId] = (productCounts[productId] || 0) + item.quantity;
        });
      });

      // Sort by popularity and get product details
      const sortedProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([productId]) => productId);

      // Get product details
      const trendingProducts = [];
      for (const productId of sortedProducts) {
        try {
          const product = await this.getProduct(productId);
          trendingProducts.push({
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.body_html,
            price: product.variants[0]?.price || '0',
            image: product.images[0]?.src || null,
            tags: product.tags.split(',').map(tag => tag.trim()),
            vendor: product.vendor,
            product_type: product.product_type,
            popularity: productCounts[productId]
          });
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
        }
      }

      return trendingProducts;
    } catch (error) {
      console.error('Error getting trending products:', error.response?.data || error.message);
      throw new Error('Failed to get trending products from Shopify');
    }
  }

  // Create a cart (for recommendations)
  async createCart(items) {
    try {
      const cartData = {
        line_items: items.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity || 1
        }))
      };

      const response = await axios.post(
        `${this.baseURL}/carts.json`,
        { cart: cartData },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.cart;
    } catch (error) {
      console.error('Error creating cart:', error.response?.data || error.message);
      throw new Error('Failed to create cart in Shopify');
    }
  }

  // Get shop information
  async getShopInfo() {
    try {
      const response = await axios.get(
        `${this.baseURL}/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.shop;
    } catch (error) {
      console.error('Error fetching shop info:', error.response?.data || error.message);
      throw new Error('Failed to fetch shop information from Shopify');
    }
  }

  // Validate webhook signature
  validateWebhookSignature(payload, signature, secret) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const hash = hmac.digest('base64');
    return hash === signature;
  }
}

module.exports = new ShopifyService();
