import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private cartService: CartService,
    private authService: AuthService,
    private dataService: DataService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.checkoutForm = this.formBuilder.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      remarks: ['']
    });

    this.loadProfile();
  }

  get f() { return this.checkoutForm.controls; }

  get cartItems(): CartItem[] {
    return this.cartService.items;
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

  loadProfile() {
    if (this.authService.isLoggedIn) {
      this.authService.getCustomerProfile().subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.checkoutForm.patchValue({
              name: res.data.name || '',
              phone: res.data.phone || '',
              address: res.data.address || '',
              city: res.data.city || '',
              pincode: res.data.pincode || ''
            });
          }
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  placeOrder() {
    this.submitted = true;

    if (this.checkoutForm.invalid) {
      return;
    }

    if (this.cartItems.length === 0) {
      return;
    }

    this.loading = true;

    const payload = {
      items: this.cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      remarks: this.checkoutForm.value.remarks || '',
      name: this.checkoutForm.value.name,
      phone: this.checkoutForm.value.phone,
      address: this.checkoutForm.value.address,
      city: this.checkoutForm.value.city,
      pincode: this.checkoutForm.value.pincode
    };

    this.dataService.createOrder(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toastService.success('Order placed successfully! Order Number: ' + res.data.orderNumber);
          this.cartService.clearCart();
          this.router.navigate(['/orders']);
        } else {
          this.toastService.error('Failed to place order: ' + res.message);
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'An error occurred while placing the order.');
      }
    });
  }

  onImgError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA4MCA4MCI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM4ODgiIGZvbnQtc2l6ZT0iMTBweCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }
}
