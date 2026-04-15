import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PermissionService } from './services/permission.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Angular Ecommerce Dashboard | TailAdmin';

  constructor(private permissionService: PermissionService) {}

  ngOnInit(): void {
    // Charger les permissions au démarrage de l'application
    this.permissionService.loadUserPermissions();
  }
}
