import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;

  // Admin states
  summary: any = null;
  lowStockProducts: any[] = [];
  inventoryProducts: any[] = [];
  recentOrders: any[] = [];
  monthlySalesKeys: string[] = [];
  statusDistribution: { [key: string]: number } = {};

  // Customer/Guest states
  categories: any[] = [];
  products: any[] = [];
  selectedCategoryId: number | null = null;
  searchQuery = '';
  wishlistProductIds: Set<number> = new Set();
  showWishlistOnly = false;
  
  // Details Modal
  detailsModalOpen = false;
  selectedProduct: any = null;
  detailQty = 1;
  private refreshInterval: any;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((x: any) => {
      this.currentUser = x;
      this.refreshDashboardData();
    });
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  private refreshDashboardData() {
    if (this.isAdmin) {
      this.loadAdminData();
    } else {
      this.loadCustomerData();
    }

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = window.setInterval(() => {
      if (this.isAdmin) {
        this.loadAdminData();
      } else {
        this.loadCustomerData();
      }
    }, 10000);
  }

  // ================= ADMIN LOGIC =================
  loadAdminData() {
    this.dataService.getDashboardSummary().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.summary = res.data;
          this.statusDistribution = res.data.orderStatusDistribution || {};
          
          if (res.data.monthlySales) {
            this.monthlySalesKeys = Object.keys(res.data.monthlySales).sort();
          }
        }
      }
    });

    this.dataService.getProducts({ size: 100 }).subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.content) {
          const list = res.data.content;
          this.inventoryProducts = list;
          this.lowStockProducts = list.filter((p: any) => p.stock && p.stock.quantityAvailable <= (p.reorderLevel || 5));
        }
      }
    });

    this.dataService.getAllOrders({ size: 10 }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.recentOrders = res.data.content || [];
        }
      }
    });
  }

  getSalesPercentage(value: number): number {
    if (this.monthlySalesKeys.length === 0) return 0;
    const values = this.monthlySalesKeys.map(k => this.summary.monthlySales[k]);
    const maxVal = Math.max(...values, 1);
    return (value / maxVal) * 80;
  }

  getStrokeDashArray(): string {
    if (!this.summary || this.summary.totalOrders === 0) return '0 252';
    const total = this.summary.totalOrders;
    const completeStatusCount = (this.statusDistribution['DELIVERED'] || 0) + (this.statusDistribution['CONFIRMED'] || 0);
    const percentage = (completeStatusCount / total) * 251.3;
    return `${percentage} 251.3`;
  }

  getOrderStatusClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    const map: { [key: string]: string } = {
      pending: 'pending',
      confirmed: 'confirmed',
      packed: 'packed',
      out_for_delivery: 'shipping',
      shipping: 'shipping',
      delivered: 'delivered',
      cancelled: 'cancelled'
    };
    return map[normalized] || 'pending';
  }

  getInventoryStatus(product: any): string {
    const quantity = product?.stock?.quantityAvailable ?? 0;
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= (product.reorderLevel || 5)) return 'Low Stock';
    return 'In Stock';
  }

  getInventoryBadgeClass(product: any): string {
    const quantity = product?.stock?.quantityAvailable ?? 0;
    if (quantity <= 0) return 'badge-cancelled';
    if (quantity <= (product.reorderLevel || 5)) return 'badge-pending';
    return 'badge-delivered';
  }

  // ================= CUSTOMER / GUEST LOGIC =================
  loadCustomerData() {
    this.dataService.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data.content || [];
        }
      }
    });

    this.loadWishlist();
    this.fetchProducts();
  }

  loadWishlist() {
    if (this.currentUser && this.authService.hasRole('CUSTOMER')) {
      this.dataService.getWishlist().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.wishlistProductIds = new Set(res.data.map((item: any) => item.product.id));
          }
        }
      });
    }
  }

  fetchProducts() {
    const params: any = {
      status: 'ACTIVE',
      size: 100
    };
    if (this.selectedCategoryId !== null) {
      params.categoryId = this.selectedCategoryId;
    }
    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    this.dataService.getProducts(params).subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.content) {
          let list = res.data.content;
          if (this.showWishlistOnly) {
            list = list.filter((p: any) => this.wishlistProductIds.has(p.id));
          }
          this.products = list;
        }
      }
    });
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId = id;
    this.fetchProducts();
  }

  onSearchChange() {
    this.fetchProducts();
  }

  resetFilters() {
    this.selectedCategoryId = null;
    this.searchQuery = '';
    this.showWishlistOnly = false;
    this.fetchProducts();
  }

  toggleWishlist(product: any) {
    if (!this.currentUser) {
      this.toastService.error('Please log in to add products to your wishlist.');
      this.router.navigate(['/login']);
      return;
    }

    const id = product.id;
    if (this.wishlistProductIds.has(id)) {
      this.dataService.removeFromWishlist(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.wishlistProductIds.delete(id);
            this.toastService.success('Removed from wishlist');
            if (this.showWishlistOnly) {
              this.fetchProducts();
            }
          }
        }
      });
    } else {
      this.dataService.addToWishlist(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.wishlistProductIds.add(id);
            this.toastService.success('Added to wishlist');
          }
        }
      });
    }
  }

  isInWishlist(productId: number): boolean {
    return this.wishlistProductIds.has(productId);
  }

  toggleShowWishlistOnly() {
    this.showWishlistOnly = !this.showWishlistOnly;
    this.fetchProducts();
  }

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA4MCA4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4ODgiIGZvbnQtc2l6ZT0iMTBweCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }

  // Cart logic
  addToCart(product: any) {
    this.cartService.addToCart(product, 1);
    this.toastService.success(`${product.name} added to cart!`);
  }

  // Details Modal
  openDetailsModal(product: any) {
    this.selectedProduct = product;
    this.detailQty = 1;
    this.detailsModalOpen = true;
  }

  closeDetailsModal() {
    this.detailsModalOpen = false;
    this.selectedProduct = null;
  }

  incDetailQty() {
    const maxQty = this.selectedProduct.stock ? this.selectedProduct.stock.quantityAvailable : 0;
    if (this.detailQty < maxQty) {
      this.detailQty++;
    }
  }

  decDetailQty() {
    if (this.detailQty > 1) {
      this.detailQty--;
    }
  }

  addSelectedToCart() {
    if (this.selectedProduct) {
      this.cartService.addToCart(this.selectedProduct, this.detailQty);
      this.toastService.success(`${this.detailQty} x ${this.selectedProduct.name} added to cart!`);
      this.closeDetailsModal();
    }
  }

  // Deterministic ratings and reviews helpers
  getProductRating(productId: number): { score: number, count: number } {
    const score = 4.0 + ((productId * 7) % 11) / 10;
    const count = 12 + (productId * 13) % 45;
    return { score: parseFloat(score.toFixed(1)), count };
  }

  getStarsArray(score: number): number[] {
    const rounded = Math.round(score);
    return Array(rounded).fill(1);
  }

  getEmptyStarsArray(score: number): number[] {
    const rounded = Math.round(score);
    return Array(5 - rounded).fill(1);
  }

  getProductReviews(productId: number): { author: string, rating: number, date: string, text: string }[] {
    const reviewsPool = [
      { author: 'Jane Doe', rating: 5, date: '2026-06-15', text: 'Absolutely love this! The quality is premium and it exceeded my expectations.' },
      { author: 'Rahul S.', rating: 4, date: '2026-06-20', text: 'Great value for money. Very durable and works exactly as described.' },
      { author: 'Amit K.', rating: 5, date: '2026-06-28', text: 'Superb product! Highly recommended to everyone looking for quality.' },
      { author: 'Sarah Jenkins', rating: 4, date: '2026-07-02', text: 'Decent product, fast delivery. Will purchase again.' },
      { author: 'David L.', rating: 3, date: '2026-07-05', text: 'It is okay, but could have been slightly better packaged.' }
    ];
    const index1 = (productId) % reviewsPool.length;
    const index2 = (productId + 2) % reviewsPool.length;
    const index3 = (productId + 4) % reviewsPool.length;
    return [
      reviewsPool[index1],
      reviewsPool[index2],
      reviewsPool[index3]
    ];
  }
}
