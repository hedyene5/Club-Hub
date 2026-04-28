import { Component, Input, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, StoredUser } from '../../services/auth.service';

@Component({
    selector: 'app-profile-dropdown',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <div class="relative" *ngIf="user">
            <button (click)="toggleDropdown()"
                    class="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none">
                <div class="text-right">
                    <div class="text-sm font-medium text-zinc-900">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="text-xs text-emerald-600 font-medium">{{ user.role }}</div>
                </div>
                <div class="w-9 h-9 rounded-2xl overflow-hidden ring-2 ring-white shadow-sm">
                    <img [src]="user.profilePhoto || 'https://picsum.photos/id/64/128/128'"
                         [alt]="user.firstName"
                         class="w-full h-full object-cover">
                </div>
            </button>

            <!-- Dropdown -->
            <div *ngIf="isOpen()"
                 class="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-zinc-100 py-2 text-sm overflow-hidden z-50">

                <div class="px-6 py-5 border-b border-zinc-100 flex gap-4">
                    <div class="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0">
                        <img [src]="user.profilePhoto || 'https://picsum.photos/id/64/128/128'"
                             [alt]="user.firstName"
                             class="w-full h-full object-cover">
                    </div>
                    <div>
                        <div class="font-semibold">{{ user.firstName }} {{ user.lastName }}</div>
                        <div class="text-xs text-zinc-500">{{ user.email }}</div>
                        <div class="text-emerald-600 text-sm font-medium mt-1">{{ user.role }}</div>
                    </div>
                </div>

                <div class="py-2">
                    <a routerLink="/profile" class="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50 transition-colors">
                        👤 My Profile
                    </a>
                    <a routerLink="/settings" class="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50 transition-colors">
                        ⚙️ Settings
                    </a>
                    <a routerLink="/my-clubs" class="flex items-center gap-3 px-6 py-3 hover:bg-zinc-50 transition-colors">
                        🏛️ My Clubs
                    </a>
                </div>

                <div class="border-t border-zinc-100 pt-2">
                    <button (click)="logout()"
                            class="flex w-full items-center gap-3 px-6 py-3 text-red-600 hover:bg-zinc-50 transition-colors">
                        ⭍ Log out
                    </button>
                </div>
            </div>
        </div>
    `
})
export class ProfileDropdownComponent {
    @Input() user!: StoredUser;
    isOpen = signal(false);

    constructor(private authService: AuthService) {}

    toggleDropdown() {
        this.isOpen.update(v => !v);
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        if (!(event.target as HTMLElement).closest('app-profile-dropdown')) {
            this.isOpen.set(false);
        }
    }

    logout() {
        this.authService.logout();   // synchronous – clears local session
        window.location.href = '/signin';
    }
}