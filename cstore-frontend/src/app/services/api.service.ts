import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: string;
  clubId?: string;
  name: string;
  description?: string;
  price: number;
  productType: string;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrl?: string;
  size?: string;
  color?: string;
  eventName?: string;
  eventDate?: string;
  venue?: string;
  totalTickets?: number;
  availableTickets?: number;
  membershipDurationMonths?: number;
  membershipLevel?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  memberId: string;
  orderNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  orderDate?: string;
  shippingAddress: string;
  paymentMethod: string;
  createdAt?: string;
  updatedAt?: string;
}

// This interface matches your backend OrderRequest DTO exactly
export interface OrderRequestPayload {
  memberId: string;
  shippingAddress: string;
  paymentMethod: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

const API_URL = 'http://localhost:8082/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  // ========== PRODUITS ==========
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_URL}/products`, { withCredentials: true });
  }

  getProductsByType(type: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_URL}/products/type/${type}`, { withCredentials: true });
  }

  getAvailableProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_URL}/products/available`, { withCredentials: true });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${API_URL}/products/${id}`, { withCredentials: true });
  }

  // AI Recommendation endpoint
  getProductRecommendations(productId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_URL}/products/${productId}/recommendations`, { withCredentials: true });
  }

  // Next upcoming event (tickets only)
  getNextUpcomingEvent(): Observable<Product> {
    return this.http.get<Product>(`${API_URL}/products/next-event`, { withCredentials: true });
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${API_URL}/products`, product, { withCredentials: true });
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${API_URL}/products/${id}`, product, { withCredentials: true });
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/products/${id}`, { withCredentials: true });
  }

  // ========== COMMANDES ==========
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_URL}/orders`, { withCredentials: true });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${API_URL}/orders/${id}`, { withCredentials: true });
  }

  getOrdersByMember(memberId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${API_URL}/orders/member/${memberId}`, { withCredentials: true });
  }

  // Updated to use OrderRequestPayload instead of Order
  createOrder(orderData: OrderRequestPayload): Observable<Order> {
    return this.http.post<Order>(`${API_URL}/orders`, orderData, { withCredentials: true });
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.put<Order>(`${API_URL}/orders/${id}/status?status=${status}`, {}, { withCredentials: true });
  }
}