import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-scan-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './scan-success.component.html',
  styleUrls: ['./scan-success.component.css']
})
export class ScanSuccessComponent implements OnInit {
  memberName: string = '';
  action: string = ''; // 'validated' or 'rejected'

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.memberName = this.route.snapshot.queryParams['memberName'] || 'Membre';
    this.action = this.route.snapshot.queryParams['action'] || 'validated';
    
    console.log('✅ Action:', this.action, 'pour', this.memberName);
  }

  get isValidated(): boolean {
    return this.action === 'validated';
  }

  get isRejected(): boolean {
    return this.action === 'rejected';
  }

  scanAnother() {
    // Retour à la page d'accueil ou dashboard
    this.router.navigate(['/dashboard']);
  }
}
