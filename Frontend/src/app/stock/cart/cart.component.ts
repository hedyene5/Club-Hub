import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService, CartItem } from '../../services/stock/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  totalItems: number = 0;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.cartService.getTotalPrice();
      this.totalItems = this.cartService.getTotalItems();
    });
  }

  updateQuantity(item: CartItem, quantity: number) {
    this.cartService.updateQuantity(item.id, quantity);
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.id);
  }

  clearCart() {
    this.cartService.clearCart();
  }

  checkout() {
    // Vérifier si le panier n'est pas vide
    if (this.cartItems.length === 0) {
      alert('Votre panier est vide');
      return;
    }
    // Naviguer vers orders avec un paramètre pour ouvrir le formulaire
    this.router.navigate(['/orders'], { queryParams: { openForm: 'true' } });
  }
}