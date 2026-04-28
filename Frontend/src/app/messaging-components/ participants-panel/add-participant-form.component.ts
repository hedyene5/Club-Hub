import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ParticipantService } from '../../services/Messaging/participant.service';
import { ConversationService } from '../../services/Messaging/conversation.service';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserSimple } from '../NewPrivateChatModalComponent/new-private-chat-modal.component';
import {AuthService} from "../../shared/services/auth.service"; // adjust path as needed

@Component({
    selector: 'app-add-participant-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <!-- SEARCH MODE -->
        <ng-container *ngIf="!selectedUser">
            <div class="relative mb-4">
                <div class="relative group">
                    <input type="text"
                           [(ngModel)]="searchQuery"
                           (input)="onSearchInput()"
                           placeholder="Rechercher par nom..."
                           class="w-full p-4 pl-12 bg-white border border-slate-200 rounded-[1rem] text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 shadow-sm" />
                    <svg class="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2.5"/>
                    </svg>
                </div>

                <!-- Search Results Dropdown -->
                <div *ngIf="searchResults.length > 0"
                     class="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-[1rem] shadow-xl max-h-56 overflow-y-auto z-[200] p-2 animate-in fade-in slide-in-from-top-2">
                    <div *ngFor="let user of searchResults"
                         (click)="selectUser(user)"
                         class="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-all group/item">
                        <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                            {{ user.fullName.charAt(0).toUpperCase() }}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[13px] font-black text-slate-700 truncate">{{ user.fullName }}</p>
                            <p class="text-[10px] text-slate-400 font-bold uppercase truncate">&#64;{{ user.fullName}}</p>
                        </div>
                        <span class="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
                        </span>
                    </div>
                </div>
            </div>
        </ng-container>

        <!-- SELECTED USER MODE -->
        <ng-container *ngIf="selectedUser">
            <div class="mb-6 p-4 bg-white border border-slate-200 rounded-[1rem] shadow-sm flex items-center gap-3">
                <div class="w-10 h-10 rounded-[0.8rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                    {{ selectedUser.fullName.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1">
                    <p class="text-[13px] font-black text-slate-700">{{ selectedUser.fullName }}</p>
                    <select [(ngModel)]="selectedRole"
                            class="bg-transparent text-[9px] uppercase tracking-[0.1em] font-black outline-none border-none p-0 cursor-pointer text-slate-500 hover:text-indigo-600 transition-colors">
                        <option value="MEMBRE">Membre</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                <button (click)="clearSelection()"
                        class="w-6 h-6 rounded-full hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2.5"/></svg>
                </button>
            </div>
        </ng-container>

        <!-- ERROR -->
        <div *ngIf="error" class="mb-3 p-3 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl text-center border border-red-100">
            {{ error }}
        </div>

        <!-- BUTTONS -->
        <div class="flex gap-3">
            <button (click)="cancelled.emit()"
                    class="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">
                Annuler
            </button>
            <button (click)="submit()"
                    [disabled]="!selectedUser || loading"
                    class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition">
                {{ loading ? 'Ajout...' : 'Ajouter' }}
            </button>
        </div>
    `
})
export class AddParticipantFormComponent implements OnInit, OnDestroy {
    @Input() conversationId!: string;
    @Output() added = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    // Search state
    searchQuery = '';
    searchResults: UserSimple[] = [];
    selectedUser: UserSimple | null = null;
    selectedRole: 'MEMBRE' | 'ADMIN' = 'MEMBRE';

    loading = false;
    error = '';
    currentUserId = '';

    private searchSubject = new Subject<string>();
    private searchSub?: any;

    constructor(
        private participantService: ParticipantService,
        private conversationService: ConversationService,
        private authService: AuthService
    ) {
        this.currentUserId = this.authService.getCurrentUser()?.userId ?? '';
    }

    ngOnInit() {
        this.searchSub = this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => this.conversationService.searchUsers(query))
        ).subscribe(results => {
            // Exclude current user
            this.searchResults = results.filter(u => u.userId !== this.currentUserId);
        });
    }

    ngOnDestroy() {
        this.searchSub?.unsubscribe();
    }

    onSearchInput() {
        const query = this.searchQuery.trim();
        if (query) {
            this.searchSubject.next(query);
        } else {
            this.searchResults = [];
        }
    }

    selectUser(user: UserSimple) {
        this.selectedUser = user;
        this.searchQuery = '';
        this.searchResults = [];
        this.selectedRole = 'MEMBRE';
        this.error = '';
    }

    clearSelection() {
        this.selectedUser = null;
    }

    submit(): void {
        if (!this.selectedUser) return;
        this.loading = true;
        this.error = '';

        this.participantService.addParticipant(this.conversationId, {
            conversationId: this.conversationId,
            userId: this.selectedUser.userId,
            role: this.selectedRole
        }).subscribe({
            next: () => {
                this.loading = false;
                this.added.emit();
                this.clearSelection();
            },
            error: () => {
                this.error = 'Utilisateur introuvable ou déjà dans la conversation.';
                this.loading = false;
            }
        });
    }
}