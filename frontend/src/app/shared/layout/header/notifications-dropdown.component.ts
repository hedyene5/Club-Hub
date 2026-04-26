import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notifications-dropdown',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="relative">
            <button
                    (click)="toggleDropdown()"
                    class="w-9 h-9 flex items-center justify-center text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-2xl transition-all relative focus:outline-none">
                🛎️
                <span class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center ring-2 ring-white">
          3
        </span>
            </button>

            <!-- Dropdown Menu -->
            <div *ngIf="isOpen()"
                 class="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden z-50">
                <div class="p-4 border-b border-zinc-100">
                    <h3 class="font-semibold text-zinc-900">Notifications</h3>
                </div>

                <div class="max-h-96 overflow-auto">
                    <div *ngFor="let notif of notifications"
                         class="px-4 py-4 hover:bg-zinc-50 border-b border-zinc-100 last:border-none flex gap-4">
                        <div class="text-2xl flex-shrink-0">{{ notif.icon }}</div>
                        <div class="flex-1">
                            <p class="text-sm text-zinc-900">{{ notif.message }}</p>
                            <p class="text-xs text-zinc-500 mt-1">{{ notif.time }}</p>
                        </div>
                    </div>
                </div>

                <div class="p-4 text-center text-brand-500 text-sm font-medium hover:bg-zinc-50 cursor-pointer border-t border-zinc-100">
                    View all notifications
                </div>
            </div>
        </div>
    `
})
export class NotificationsDropdownComponent {
    isOpen = signal(false);

    notifications = [
        { icon: '📅', message: 'New event "Tech Talk" created by Sarah', time: '2 min ago' },
        { icon: '🗳️', message: 'Election for Vice President is now open', time: '1 hour ago' },
        { icon: '💰', message: 'Treasury report is ready for review', time: 'Yesterday' },
    ];

    toggleDropdown() {
        this.isOpen.update(open => !open);
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('app-notifications-dropdown')) {
            this.isOpen.set(false);
        }
    }
}