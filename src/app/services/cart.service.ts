import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  productId: number;
  productName: string;
  price: number;
  gstPercent: number;
  imageUrl: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$: Observable<CartItem[]> = this.cartItemsSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  private get localStorageKey(): string {
    return 'oms_shopping_cart';
  }

  private loadCart() {
    const saved = localStorage.getItem(this.localStorageKey);
    if (saved) {
      try {
        this.cartItemsSubject.next(JSON.parse(saved));
      } catch (e) {
        this.cartItemsSubject.next([]);
      }
    }
  }

  private saveCart(items: CartItem[]) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(items));
    this.cartItemsSubject.next(items);
  }

  get items(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  addToCart(product: any, quantity: number = 1) {
    const current = [...this.items];
    const existingIndex = current.findIndex(item => item.productId === product.id);

    if (existingIndex > -1) {
      current[existingIndex].quantity += quantity;
    } else {
      current.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        gstPercent: product.gstPercent || 0,
        imageUrl: product.imageUrl,
        quantity: quantity
      });
    }
    this.saveCart(current);
  }

  updateQuantity(productId: number, quantity: number) {
    let current = [...this.items];
    const index = current.findIndex(item => item.productId === productId);

    if (index > -1) {
      if (quantity <= 0) {
        current = current.filter(item => item.productId !== productId);
      } else {
        current[index].quantity = quantity;
      }
      this.saveCart(current);
    }
  }

  removeFromCart(productId: number) {
    const current = this.items.filter(item => item.productId !== productId);
    this.saveCart(current);
  }

  clearCart() {
    this.saveCart([]);
  }

  get itemCount(): number {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  get subtotal(): number {
    return this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  get gstAmount(): number {
    return this.items.reduce((acc, item) => {
      const lineSub = item.price * item.quantity;
      return acc + (lineSub * (item.gstPercent / 100));
    }, 0);
  }

  get totalAmount(): number {
    return this.subtotal + this.gstAmount;
  }
}
