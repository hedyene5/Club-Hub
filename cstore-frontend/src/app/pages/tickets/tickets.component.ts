import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Product } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.css']
})
export class TicketsComponent implements OnInit {
  tickets: Product[] = [];
  loading = true;
  searchTerm = '';

  constructor(
    private apiService: ApiService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.loading = true;
    this.apiService.getAllProducts().subscribe({
      next: (data) => {
        this.tickets = data.filter(p => p.productType === 'EVENT_TICKET' && p.isAvailable);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
        this.loading = false;
      }
    });
  }

  get filteredTickets() {
    if (!this.searchTerm.trim()) return this.tickets;
    const term = this.searchTerm.toLowerCase();
    return this.tickets.filter(t => 
      t.name.toLowerCase().includes(term) || 
      (t.eventName && t.eventName.toLowerCase().includes(term))
    );
  }

  addToCart(ticket: Product) {
    this.cartService.addToCart(ticket, 1);
    alert(`✅ ${ticket.name} ajouté au panier`);
  }

  buyNow(ticket: Product) {
    this.cartService.addToCart(ticket, 1);
    this.router.navigate(['/cart']);
  }

  getStockStatus(stock: number): string {
    if (stock <= 0) return 'Complet';
    if (stock < 100) return `Plus que ${stock} places`;
    return `${stock} places disponibles`;
  }
}