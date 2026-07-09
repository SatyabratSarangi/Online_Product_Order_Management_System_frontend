import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { DataService } from '../../services/data.service';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  sidebarOpen = false;
  showNotifications = false;
  showCart = false;
  currentUser: any = null;
  notifications: any[] = [];
  deferredPrompt: any = null;
  showInstallBtn = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    public themeService: ThemeService,
    private dataService: DataService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((x: any) => {
      this.currentUser = x;
      if (x) {
        this.loadNotifications();
      } else {
        this.notifications = [];
      }
    });
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get isCustomer(): boolean {
    return this.authService.hasRole('CUSTOMER');
  }

  get isAgent(): boolean {
    return this.authService.hasRole('AGENT');
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get cartItems(): CartItem[] {
    return this.cartService.items;
  }

  get cartCount(): number {
    return this.cartService.itemCount;
  }

  get cartSubtotal(): number {
    return this.cartService.subtotal;
  }

  get cartGst(): number {
    return this.cartService.gstAmount;
  }

  get cartTotal(): number {
    return this.cartService.totalAmount;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile() {
    if (window.innerWidth <= 992) {
      this.sidebarOpen = false;
    }
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showNotifications = false;
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showCart = false;
      this.loadNotifications();
    }
  }

  toggleCart() {
    this.showCart = !this.showCart;
    if (this.showCart) {
      this.showNotifications = false;
    }
  }

  updateQty(productId: number, qty: number) {
    this.cartService.updateQuantity(productId, qty);
  }

  removeItem(productId: number) {
    this.cartService.removeFromCart(productId);
  }

  checkout() {
    this.showCart = false;
    if (!this.currentUser) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
    } else {
      this.router.navigate(['/checkout']);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  loadNotifications() {
    this.dataService.getNotifications().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.notifications = res.data;
        }
      }
    });
  }

  markRead(note: any) {
    if (!note.read) {
      this.dataService.markNotificationAsRead(note.id).subscribe({
        next: () => {
          note.read = true;
        }
      });
    }
  }

  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      BOOKING: 'local_offer',
      ORDER_STATUS: 'inventory_2',
      ISSUE_REPLY: 'support'
    };
    return iconMap[type] || 'notifications';
  }

  getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  markAllNotificationsAsRead() {
    const unreadIds = this.notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    let completed = 0;
    unreadIds.forEach(id => {
      this.dataService.markNotificationAsRead(id).subscribe({
        next: () => {
          completed++;
          if (completed === unreadIds.length) {
            this.notifications = [];
          }
        }
      });
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA4MCA4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4ODgiIGZvbnQtc2l6ZT0iMTBweCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: any) {
    e.preventDefault();
    this.deferredPrompt = e;
    this.showInstallBtn = true;
  }

  installPwa() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      this.deferredPrompt = null;
      this.showInstallBtn = false;
    });
  }
}
