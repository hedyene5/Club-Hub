import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService, Product } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { RecentlyViewedService } from '../../services/recently-viewed.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  recommendations: Product[] = [];
  certificateName: string = '';

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

  // ========== CERTIFICATE GENERATION WITH CLUB NAME ==========
  async generateCertificate() {
    if (!this.certificateName.trim()) {
      alert('Veuillez entrer votre nom');
      return;
    }

    // Use clubName from product, or fallback to product name, then default
    const clubName = this.product?.clubName || this.product?.name || 'Notre Club';
    const certificateTitle = 'CERTIFICAT DE MEMBRE';

    const certDiv = document.createElement('div');
    certDiv.style.width = '800px';
    certDiv.style.padding = '40px';
    certDiv.style.backgroundColor = '#ffffff';
    certDiv.style.fontFamily = 'Georgia, "Times New Roman", serif';
    certDiv.style.borderRadius = '24px';
    certDiv.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1)';

    certDiv.innerHTML = `
      <div style="background: linear-gradient(135deg, #fff8e7 0%, #fff 100%); border: 2px solid #fbbf24; border-radius: 24px; padding: 30px;">
        <!-- Club header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
          <div style="font-size: 14px; letter-spacing: 4px; color: #b45309;">${this.escapeHtml(clubName).toUpperCase()}</div>
          <h1 style="font-size: 42px; font-weight: bold; color: #1e3a8a; margin: 10px 0 0;">${certificateTitle}</h1>
        </div>

        <!-- Certificate body -->
        <div style="text-align: center; margin: 40px 0;">
          <p style="font-size: 18px; color: #374151;">Ce certificat est décerné à</p>
          <p style="font-size: 48px; font-weight: bold; color: #b45309; margin: 20px 0; border-bottom: 2px dashed #fbbf24; display: inline-block; padding-bottom: 10px;">
            ${this.escapeHtml(this.certificateName)}
          </p>
          <p style="font-size: 18px; color: #374151; margin-top: 30px;">pour son engagement et son soutien au sein de notre club.</p>
        </div>

        <!-- Product details -->
        <div style="background: #fef3c7; border-radius: 16px; padding: 20px; margin: 30px 0; text-align: center;">
          <p style="font-size: 14px; color: #92400e; text-transform: uppercase;">Objet</p>
          <p style="font-size: 24px; font-weight: bold; color: #1e3a8a;">${this.escapeHtml(this.product?.name || '')}</p>
          <p style="font-size: 14px; color: #92400e;">Délivré le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <!-- Signature & stamp area -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px;">
          <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #333; padding-top: 10px; font-size: 14px;">Le Président du Club</div>
          </div>
          <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #333; padding-top: 10px; font-size: 14px;">Cachet officiel</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af;">
          ${this.escapeHtml(clubName)} – Fier membre depuis ${new Date().getFullYear()}
        </div>
      </div>
    `;

    document.body.appendChild(certDiv);

    try {
      const canvas = await html2canvas(certDiv, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`certificat_${this.certificateName.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      document.body.removeChild(certDiv);
    }
  }

  private escapeHtml(str: string): string {
    return str.replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
}