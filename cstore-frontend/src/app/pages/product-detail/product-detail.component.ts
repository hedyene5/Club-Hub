import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';  // <-- ADD Router
import { ApiService, Product } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { RecentlyViewedService } from '../../services/recently-viewed.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div *ngIf="loading" class="text-center py-10">Chargement...</div>
      
      <div *ngIf="!loading && product" class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        <!-- Back button -->
        <button (click)="goBack()" class="m-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Retour
        </button>

        <div class="md:flex">
          <div class="md:w-1/2">
            <img [src]="product.imageUrl || 'https://placehold.co/600x400/f0f0f0/969696?text=Image'" 
                 [alt]="product.name"
                 class="w-full h-full object-cover">
          </div>
          <div class="p-6 md:w-1/2">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
              <span class="text-sm font-medium text-gray-500">{{ getProductTypeLabel(product.productType) }}</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ product.name }}</h1>
            <p class="text-gray-600 mb-4">{{ product.description || 'Aucune description' }}</p>
            <div *ngIf="product.size || product.color" class="text-sm text-gray-500 mb-4">
              <span *ngIf="product.size">Taille: {{ product.size }}</span>
              <span *ngIf="product.size && product.color"> | </span>
              <span *ngIf="product.color">Couleur: {{ product.color }}</span>
            </div>
            <div class="text-3xl font-bold text-gray-900 mb-4">{{ product.price }} €</div>
            <div class="flex gap-3">
              <button (click)="addToCart()" 
                      [disabled]="product.stockQuantity <= 0"
                      class="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow hover:shadow-lg transition">
                Ajouter au panier
              </button>
              <button (click)="buyNow()" 
                      [disabled]="product.stockQuantity <= 0"
                      class="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition">
                Acheter maintenant
              </button>
            </div>
            <p class="mt-4 text-sm" [ngClass]="product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'">
              {{ product.stockQuantity > 0 ? 'En stock' : 'Rupture de stock' }}
            </p>
          </div>
        </div>
      </div>
      <div *ngIf="!loading && !product" class="text-center py-10">Produit non trouvé</div>
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,                     // <-- ADD Router here
    private apiService: ApiService,
    private cartService: CartService,
    private recentlyViewed: RecentlyViewedService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.getProductById(id).subscribe({
        next: (product) => {
          this.product = product;
          this.recentlyViewed.addProduct(product);
          this.loading = false;
        },
        error: () => this.loading = false
      });
    } else {
      this.loading = false;
    }
  }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, 1);
      alert(`✅ ${this.product.name} ajouté au panier`);
    }
  }

  buyNow() {
    if (this.product) {
      this.cartService.addToCart(this.product, 1);
      this.router.navigate(['/cart']);          // <-- Now router is defined
    }
  }

  goBack() {
    this.router.navigate(['/products']);
  }

  getProductTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      JERSEY: 'Maillot',
      TSHIRT: 'T-Shirt',
      HAT: 'Casquette',
      SCARF: 'Écharpe',
      ACCESSORY: 'Accessoire',
      CERTIFICATE: 'Certificat'
    };
    return labels[type] || type;
  }
}