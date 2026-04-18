import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ConversationParticipant, ParticipantService } from '../../services/Messaging/participant.service';
import { ConversationService } from '../../services/Messaging/conversation.service';
import { SupabaseService } from '../../services/User/supabase.service';
import { FormsModule } from "@angular/forms";
import { AddParticipantFormComponent } from "./add-participant-form.component";
import { CommonModule } from '@angular/common';

export type SidebarView = 'MENU' | 'MEMBERS' | 'EDIT_PHOTO' | 'EDIT_NAME' | 'USER_DETAILS';

@Component({
    selector: 'app-participants-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, AddParticipantFormComponent],
    templateUrl: './participants-panel.component.html',
})
export class ParticipantsPanelComponent implements OnInit {
    @Input() conversationId!: string;
    @Input() currentUserId!: string;
    @Input() isGroup: boolean = false;
    @Input() groupName: string = 'dev';

    @Output() groupNameChanged = new EventEmitter<string>();
    @Output() groupPhotoChanged = new EventEmitter<string>();

    currentView: SidebarView = 'MENU';
    participants: ConversationParticipant[] = [];
    selectedParticipant: ConversationParticipant | null = null;
    showAddModal = false;

    newName: string = '';
    imagePreview: string | ArrayBuffer | null = null;
    selectedFile: File | null = null;
    isUploadingPhoto = false;

    constructor(
        private participantService: ParticipantService,
        private conversationService: ConversationService,
        private supabaseService: SupabaseService
    ) {}

    ngOnInit(): void {
        this.loadParticipants();
        this.newName = this.groupName;
    }

    setView(view: SidebarView) {
        this.currentView = view;
        if (view !== 'USER_DETAILS') this.selectedParticipant = null;
        if (view !== 'EDIT_PHOTO') {
            this.imagePreview = null;
            this.selectedFile = null;
        }
    }

    get currentParticipant() {
        return this.participants.find(p => p.userId === this.currentUserId);
    }

    get isAdmin() {
        return ['ADMIN', 'SUPERADMIN'].includes(this.currentParticipant?.role ?? '');
    }

    updateGroupName() {
        if (!this.newName.trim()) return;
        this.conversationService.updateName(this.conversationId, this.newName).subscribe({
            next: () => {
                this.groupName = this.newName;
                this.groupNameChanged.emit(this.newName);
                this.setView('MENU');
            },
            error: (err) => console.error('Failed to update name', err)
        });
    }

    async saveGroupPhoto() {
        if (!this.selectedFile) return;
        this.isUploadingPhoto = true;

        try {
            const photoUrl = await this.supabaseService.uploadGroupPhoto(
                this.conversationId,
                this.selectedFile
            );

            this.conversationService.updatePhotoUrl(this.conversationId, photoUrl).subscribe({
                next: () => {
                    this.imagePreview = photoUrl;
                    this.groupPhotoChanged.emit(photoUrl);
                    this.selectedFile = null;
                    this.isUploadingPhoto = false;
                    this.setView('MENU');
                },
                error: (err) => {
                    console.error('Failed to save photo URL', err);
                    this.isUploadingPhoto = false;
                }
            });
        } catch (err) {
            console.error('Supabase upload failed', err);
            this.isUploadingPhoto = false;
        }
    }

    removeParticipant(userId: string): void {
        if (confirm(`Voulez-vous retirer ${userId} ?`)) {
            this.participantService.removeParticipant(this.conversationId, userId).subscribe({
                next: () => {
                    this.loadParticipants();
                    this.setView('MEMBERS');
                },
                error: (err) => console.error(err)
            });
        }
    }

    loadParticipants(): void {
        this.participantService.getParticipants(this.conversationId).subscribe({
            next: (data) => { this.participants = data; },
            error: () => {}
        });
    }

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = () => { this.imagePreview = reader.result; };
            reader.readAsDataURL(file);
        }
    }

    onParticipantAdded() {
        this.showAddModal = false;
        this.loadParticipants();
    }

    viewUserDetails(participant: ConversationParticipant): void {
        this.selectedParticipant = participant;
        this.setView('USER_DETAILS');
    }

    getRoleBadgeClass(role: string): string {
        const baseClasses = "text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest mt-0.5 block w-fit border";
        switch (role?.toUpperCase()) {
            case 'SUPERADMIN': return `${baseClasses} bg-purple-50 text-purple-600 border-purple-100`;
            case 'ADMIN': return `${baseClasses} bg-indigo-50 text-indigo-600 border-indigo-100`;
            default: return `${baseClasses} bg-slate-50 text-slate-500 border-slate-100`;
        }
    }
}