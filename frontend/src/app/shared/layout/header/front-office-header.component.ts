import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NotificationsDropdownComponent } from './notifications-dropdown.component';
import { ProfileDropdownComponent } from './profile-dropdown.component';
import { AuthService, AuthResponse } from '../../../services/User/auth.service';

@Component({
    selector: 'app-front-office-header',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        NotificationsDropdownComponent,
        ProfileDropdownComponent
    ],
    template: `
        <header class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-100 shadow-sm">
            <div class="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">

                <!-- LEFT: Logo -->
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">C</div>
                    <div>
                        <span class="font-semibold tracking-tighter text-2xl text-zinc-950">ClubHub</span>
                        <span class="text-xs text-zinc-400 block -mt-1">Communications</span>
                    </div>
                </div>

                <!-- CENTER: Navigation -->
                <nav class="hidden md:flex items-center gap-1 bg-zinc-50 rounded-3xl p-1 border border-zinc-100">
                    <a routerLink="/home" routerLinkActive="active-tab" class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all">Home</a>

                    <div class="relative group">
                        <button class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all flex items-center gap-1">
                            Members <span class="text-xs opacity-70">▼</span>
                        </button>
                        <div class="absolute hidden group-hover:block pt-2 w-56 z-50">
                            <div class="bg-white rounded-3xl shadow-xl border border-zinc-100 py-2 text-sm overflow-hidden">
                                <a routerLink="/members/community" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Community Members</a>
                                <a routerLink="/members/club" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Club Members</a>
                            </div>
                        </div>
                    </div>

                    <div class="relative group">
                        <button class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all flex items-center gap-1">
                            Operations <span class="text-xs opacity-70">▼</span>
                        </button>
                        <div class="absolute hidden group-hover:block pt-2 w-56 z-50">
                            <div class="bg-white rounded-3xl shadow-xl border border-zinc-100 py-2 text-sm overflow-hidden">
                                <a routerLink="/events" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Events</a>
                                <a routerLink="/reservations" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Reservations</a>
                                <a routerLink="/tasks" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Manage Tasks</a>
                            </div>
                        </div>
                    </div>

                    <a routerLink="/virtual-events" routerLinkActive="active-tab" class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all">Virtual Events</a>
                    <a routerLink="/messaging" routerLinkActive="active-tab" class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all">Messaging</a>
                    <a routerLink="/channels" routerLinkActive="active-tab" class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all">Channels</a>

                    <div class="relative group">
                        <button class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all flex items-center gap-1">
                            Commerce <span class="text-xs opacity-70">▼</span>
                        </button>
                        <div class="absolute hidden group-hover:block pt-2 w-56 z-50">
                            <div class="bg-white rounded-3xl shadow-xl border border-zinc-100 py-2 text-sm overflow-hidden">
                                <a routerLink="/products" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Products</a>
                                <a routerLink="/tickets" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Tickets</a>
                                <a routerLink="/cart" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Cart</a>
                                <a routerLink="/orders" class="block px-6 py-3 hover:bg-zinc-50 transition-colors">Orders</a>
                            </div>
                        </div>
                    </div>

                    <a routerLink="/elections" routerLinkActive="active-tab" class="nav-tab px-6 py-2.5 text-sm font-medium rounded-3xl transition-all">Elections</a>
                </nav>

                <!-- RIGHT: Notifications + Profile -->
                <div class="flex items-center gap-6" *ngIf="currentUser">
                    <app-notifications-dropdown />
                    <app-profile-dropdown [user]="currentUser" />
                </div>
            </div>
        </header>
    `,
    styles: [`
        .nav-tab {
            color: #52525b;
        }
        .nav-tab:hover {
            color: #18181b;
            background-color: white;
        }
        .active-tab {
            background-color: white;
            color: #18181b;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }
    `]
})
export class FrontOfficeHeaderComponent implements OnInit {
    currentUser: AuthResponse | null = null;

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        this.authService.getCurrentUser$().subscribe(user => {
            this.currentUser = user;
        });
    }
}