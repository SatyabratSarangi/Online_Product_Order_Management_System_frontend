import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit, OnDestroy {
  orders: any[] = [];
  selectedOrder: any = null;
  delivery: any = null;
  detailsModalOpen = false;
  
  timerInterval: any;
  orderCountdowns: { [orderId: number]: string } = {};

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.startCountdownTimer();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get isAgent(): boolean {
    return this.authService.hasRole('AGENT');
  }

  get isAdminOrAgent(): boolean {
    return this.isAdmin || this.isAgent;
  }

  loadOrders() {
    const req = this.isAdminOrAgent ? this.dataService.getAllOrders({ size: 100 }) : this.dataService.getMyOrders({ size: 100 });
    req.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders = res.data.content || [];
          this.updateCountdowns();
        }
      },
      error: (err) => {
        this.toastService.error('Failed to load orders.');
      }
    });
  }

  startCountdownTimer() {
    this.timerInterval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  updateCountdowns() {
    let needsRefresh = false;
    this.orders.forEach(order => {
      const normalizedStatus = (order.status || '').toUpperCase();
      if (normalizedStatus === 'DELIVERED' || normalizedStatus === 'CANCELLED') {
        this.orderCountdowns[order.id] = '';
        return;
      }

      const placedTimeStr = order.orderDate || order.createdAt;
      if (!placedTimeStr) return;

      const placedTime = new Date(placedTimeStr).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - placedTime) / 1000);
      const remaining = 300 - elapsed;

      if (remaining > 0) {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        this.orderCountdowns[order.id] = `Delivering in ${mins}:${secs < 10 ? '0' : ''}${secs}`;
      } else {
        this.orderCountdowns[order.id] = 'Delivered';
      }
    });
  }

  viewOrderDetails(order: any) {
    this.selectedOrder = order;
    this.detailsModalOpen = true;

    this.dataService.getDelivery(order.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.delivery = res.data;
        }
      },
      error: () => { this.delivery = null; }
    });
  }

  closeDetailsModal() {
    this.detailsModalOpen = false;
    this.selectedOrder = null;
    this.delivery = null;
  }

  downloadInvoice(orderId: number) {
    this.dataService.downloadInvoicePdf(orderId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${orderId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Could not download invoice at this moment.');
      }
    });
  }

  onStatusChange(orderId: number, event: any) {
    const newStatus = event.target.value;
    this.dataService.updateOrderStatus(orderId, newStatus).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success(`Order status updated to ${newStatus}`);
          if (this.selectedOrder && this.selectedOrder.id === orderId) {
            this.selectedOrder.status = newStatus;
          }
          this.loadOrders();
          this.refreshDelivery(orderId, newStatus);
        } else {
          this.toastService.error(`Failed to update status: ${res.message}`);
        }
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error updating order status.');
      }
    });
  }

  private refreshDelivery(orderId: number, status: string) {
    this.dataService.getDelivery(orderId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.delivery = res.data;
          this.delivery.deliveryStatus = status;
        }
      }
    });
  }
}
