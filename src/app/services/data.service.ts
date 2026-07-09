import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  // Set the base URL from environment
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // Categories
  getCategories(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/categories`);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/categories`, category);
  }

  updateCategory(id: number, category: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/categories/${id}`);
  }

  // Products
  getProducts(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/products`, { params: httpParams });
  }

  getProduct(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(product: any, image?: File): Observable<any> {
    if (image) {
      const formData = new FormData();
      formData.append('product', JSON.stringify(product));
      formData.append('image', image);
      return this.http.post<any>(`${this.baseUrl}/products`, formData);
    } else {
      return this.http.post<any>(`${this.baseUrl}/products`, product, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  updateProduct(id: number, product: any, image?: File): Observable<any> {
    if (image) {
      const formData = new FormData();
      formData.append('product', JSON.stringify(product));
      formData.append('image', image);
      return this.http.put<any>(`${this.baseUrl}/products/${id}`, formData);
    } else {
      return this.http.put<any>(`${this.baseUrl}/products/${id}`, product, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/products/${id}`);
  }

  // Wishlist
  getWishlist(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/wishlist`);
  }

  addToWishlist(productId: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/wishlist/${productId}`, null);
  }

  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/wishlist/${productId}`);
  }

  checkWishlist(productId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/wishlist/check/${productId}`);
  }

  // Stock
  getStock(productId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stock/${productId}`);
  }

  addStock(request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stock/add`, request);
  }

  removeStock(request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stock/remove`, request);
  }

  adjustStock(request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stock/adjust`, request);
  }

  updateStock(productId: number, request: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/stock/${productId}`, request);
  }

  getStockHistory(productId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stock/history/${productId}`);
  }

  // Dashboard
  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/summary`);
  }

  // Orders
  createOrder(request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders`, request);
  }

  getAllOrders(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/orders`, { params: httpParams });
  }

  getMyOrders(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/orders/my`, { params: httpParams });
  }

  getOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/orders/${id}`);
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/orders/${id}/status`, { status });
  }

  // Delivery
  getAllDeliveries(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}/delivery`, { params: httpParams });
  }

  getDelivery(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/delivery/${orderId}`);
  }

  updateDelivery(orderId: number, request: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/delivery/${orderId}`, request);
  }

  // Invoices
  getInvoice(orderId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/invoices/${orderId}`);
  }

  downloadInvoicePdf(orderId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/invoices/${orderId}/pdf`, { responseType: 'blob' });
  }

  // Issues
  getIssues(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/issues`, {
      params: new HttpParams().set('page', page.toString()).set('size', size.toString())
    });
  }

  getIssueById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/issues/${id}`);
  }

  createIssue(request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/issues`, request);
  }

  replyToIssue(id: number, request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/issues/${id}/reply`, request);
  }

  updateIssueStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/issues/${id}/status`, null, {
      params: new HttpParams().set('status', status)
    });
  }

  updateIssue(id: number, request: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/issues/${id}`, request);
  }

  deleteIssue(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/issues/${id}`);
  }

  // Notifications
  getNotifications(isRead?: boolean): Observable<any> {
    let httpParams = new HttpParams();
    if (isRead !== undefined) {
      httpParams = httpParams.set('isRead', isRead.toString());
    }
    return this.http.get<any>(`${this.baseUrl}/notifications`, { params: httpParams });
  }

  markNotificationAsRead(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/notifications/${id}/read`, null);
  }

  // Reports
  getSalesReport(groupBy: string, fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams().set('groupBy', groupBy);
    if (fromDate) { params = params.set('fromDate', fromDate); }
    if (toDate) { params = params.set('toDate', toDate); }
    return this.http.get<any>(`${this.baseUrl}/reports/sales`, { params });
  }

  exportReport(format: string, groupBy: string, fromDate?: string, toDate?: string): Observable<Blob> {
    let params = new HttpParams().set('format', format).set('groupBy', groupBy);
    if (fromDate) { params = params.set('fromDate', fromDate); }
    if (toDate) { params = params.set('toDate', toDate); }
    return this.http.get(`${this.baseUrl}/reports/export`, {
      params,
      responseType: 'blob'
    });
  }
}