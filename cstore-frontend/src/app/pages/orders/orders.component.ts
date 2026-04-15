import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, Order } from '../../services/api.service';
import { CartService, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  
  showOrderForm: boolean = false;
  orderForm = {
    shippingAddress: '',
    paymentMethod: ''
  };

  // Hardcoded user ID for testing
  private readonly HARDCODED_USER_ID = 'test-user-123';

  constructor(
    private apiService: ApiService,
    public cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrders();
    
    this.route.queryParams.subscribe(params => {
      if (params['openForm'] === 'true') {
        this.showOrderForm = true;
      }
    });
  }

  getCartItems(): CartItem[] {
    return this.cartService.getCartItems();
  }

  getCartTotal(): number {
    return this.cartService.getTotalPrice();
  }

  goToProducts() {
    this.router.navigate(['/products']);
  }

  loadOrders() {
    this.loading = true;
    this.errorMessage = '';
    
    // Try to get orders by member ID first
    this.apiService.getOrdersByMember(this.HARDCODED_USER_ID).subscribe({
      next: (data) => {
        this.orders = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement commandes par membre:', err);
        // Fallback to get all orders
        this.apiService.getAllOrders().subscribe({
          next: (allOrders) => {
            this.orders = allOrders || [];
            this.loading = false;
          },
          error: (err2) => {
            console.error('Erreur chargement toutes commandes:', err2);
            // Don't show error to user, just show empty orders
            this.orders = [];
            this.loading = false;
            this.errorMessage = '';
          }
        });
      }
    });
  }

  createOrder() {
    const cartItems = this.cartService.getCartItems();
    
    if (cartItems.length === 0) {
      alert('Votre panier est vide');
      return;
    }

    if (!this.orderForm.shippingAddress || !this.orderForm.shippingAddress.trim()) {
      alert('Veuillez saisir une adresse de livraison');
      return;
    }

    if (!this.orderForm.paymentMethod) {
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }

    const validPaymentMethods = ['CARTE', 'PAYPAL', 'ESPECES'];
    if (!validPaymentMethods.includes(this.orderForm.paymentMethod)) {
      alert('Mode de paiement invalide');
      return;
    }

    const orderData = {
      memberId: this.HARDCODED_USER_ID,
      shippingAddress: this.orderForm.shippingAddress.trim(),
      paymentMethod: this.orderForm.paymentMethod,
      items: cartItems.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: this.cartService.getTotalPrice(),
      status: 'PENDING'
    };

    this.apiService.createOrder(orderData).subscribe({
      next: (response) => {
        alert('Commande créée avec succès !');
        this.cartService.clearCart();
        this.loadOrders();
        this.showOrderForm = false;
        this.orderForm = {
          shippingAddress: '',
          paymentMethod: ''
        };
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        console.error('Erreur:', err);
        alert('Erreur lors de la création de la commande');
      }
    });
  }

  cancelOrder(orderId: string) {
    if (confirm('Annuler cette commande ?')) {
      this.apiService.updateOrderStatus(orderId, 'CANCELLED').subscribe({
        next: () => {
          alert('✅ Commande annulée');
          this.loadOrders();
        },
        error: (err) => {
          console.error('Erreur annulation:', err);
          alert('❌ Erreur lors de l\'annulation');
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-200 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-200 text-blue-800';
      case 'SHIPPED': return 'bg-purple-200 text-purple-800';
      case 'DELIVERED': return 'bg-green-200 text-green-800';
      case 'CANCELLED': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return '⏳ En attente';
      case 'CONFIRMED': return '✅ Confirmée';
      case 'SHIPPED': return '🚚 Expédiée';
      case 'DELIVERED': return '📦 Livrée';
      case 'CANCELLED': return '❌ Annulée';
      default: return status;
    }
  }
}