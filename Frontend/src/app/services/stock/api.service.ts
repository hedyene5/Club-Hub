import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../environments/environment';

export interface Product {
  id: string;
  clubId?: string;
  clubName?: string;
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

export interface OrderRequestPayload {
  memberId: string;
  shippingAddress: string;
  paymentMethod: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API_URL = apiUrl('/api');

  constructor(private http: HttpClient) {}

  // ========== PRODUITS ==========
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/products`, { withCredentials: true });
  }

  getProductsByType(type: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/products/type/${type}`, { withCredentials: true });
  }

  getAvailableProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/products/available`, { withCredentials: true });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`, { withCredentials: true });
  }

  getProductRecommendations(productId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/products/${productId}/recommendations`, { withCredentials: true });
  }

  getNextUpcomingEvent(): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/next-event`, { withCredentials: true });
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.API_URL}/products`, product, { withCredentials: true });
  }

  updateProduct(id: string, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/products/${id}`, product, { withCredentials: true });
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/products/${id}`, { withCredentials: true });
  }

  // ========== COMMANDES ==========
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/orders`, { withCredentials: true });
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/orders/${id}`, { withCredentials: true });
  }

  getOrdersByMember(memberId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/orders/member/${memberId}`, { withCredentials: true });
  }

  createOrder(orderData: OrderRequestPayload): Observable<Order> {
    return this.http.post<Order>(`${this.API_URL}/orders`, orderData, { withCredentials: true });
  }

  updateOrderStatus(id: string, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.API_URL}/orders/${id}/status?status=${status}`, {}, { withCredentials: true });
  }

  // ========== AI PDF EXTRACTION ==========
  extractFromPdf(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/products/extract-from-pdf`, formData);
  }
}