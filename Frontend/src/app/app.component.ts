import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { FrontOfficeHeaderComponent } from './shared/layout/header/front-office-header.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CommonModule, FrontOfficeHeaderComponent],
    template: `
    <app-front-office-header *ngIf="showHeader"></app-front-office-header>
    <div *ngIf="showHeader" class="h-16"></div>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
    showHeader = false;

    // Routes where the header MUST NOT appear
    private hiddenPrefixes = ['/landing', '/signin', '/signup', '/features', '/app'];

    constructor(private router: Router) {
        this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((e: NavigationEnd) => {
                this.showHeader = !this.hiddenPrefixes.some(prefix =>
                    e.urlAfterRedirects.startsWith(prefix)
                );
            });
    }
}