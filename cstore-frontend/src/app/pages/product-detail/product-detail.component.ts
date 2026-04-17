import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService, Product } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { RecentlyViewedService } from '../../services/recently-viewed.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html'  // Use external HTML file
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  recommendations: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cartService: CartService,
    private recentlyViewed: RecentlyViewedService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiService.getProductById(id).subscribe({
        next: (product: Product) => {
          this.product = product;
          this.recentlyViewed.addProduct(product);
          this.loading = false;
          this.loadRecommendations(product.id);
        },
        error: () => this.loading = false
      });
    } else {
      this.loading = false;
    }
  }

  loadRecommendations(productId: string) {
    this.apiService.getProductRecommendations(productId).subscribe({
      next: (data: Product[]) => this.recommendations = data,
      error: (err: any) => console.error('Recommendations error:', err)
    });
  }

  viewProduct(product: Product) {
    this.router.navigate(['/products', product.id]);
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
      this.router.navigate(['/cart']);
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