import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RecentlyViewedService } from '../../services/recently-viewed.service';
import { Product } from '../../services/api.service';

@Component({
  selector: 'app-recently-viewed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="recentProducts.length > 0" class="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <h3 class="text-sm font-semibold text-gray-700 mb-2">🕘 Récemment consultés</h3>
      <div class="flex flex-wrap gap-2">
        <a *ngFor="let product of recentProducts" 
           [routerLink]="['/products', product.id]" 
           class="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded shadow-sm hover:bg-blue-50 transition">
          <img [src]="product.imageUrl || 'https://placehold.co/30x30/f0f0f0/969696?text=?'" class="w-6 h-6 object-cover rounded">
          <span class="truncate max-w-[100px]">{{ product.name }}</span>
        </a>
      </div>
    </div>
  `
})
export class RecentlyViewedComponent implements OnInit {
  recentProducts: Product[] = [];

  constructor(private recentlyViewed: RecentlyViewedService) {}

  ngOnInit() {
    this.recentProducts = this.recentlyViewed.getProducts();
  }

  refresh() {
    this.recentProducts = this.recentlyViewed.getProducts();
  }
}