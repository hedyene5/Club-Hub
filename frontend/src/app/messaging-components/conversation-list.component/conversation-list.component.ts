import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationDTO } from "../../models/conversation.model";
import { ConversationService } from "../../services/Messaging/conversation.service";
import { ChatWindowComponent } from "../chat-window/chat-window.component";
import { NewPrivateChatModalComponent } from "../NewPrivateChatModalComponent/new-private-chat-modal.component";
import { NewGroupChatModalComponent } from "../new-group-chat-modal/new-group-chat-modal.component";
import { AuthService } from "../../services/User/auth.service";
import { WebSocketService } from "../../services/Messaging/websocket.service";
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, ChatWindowComponent, NewPrivateChatModalComponent, NewGroupChatModalComponent,FormsModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.css'],
  host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' }
})
export class ConversationListComponent implements OnInit, OnDestroy {


  conversations: ConversationDTO[] = [];
  selectedConversation: ConversationDTO | null = null;
  currentUserId: string = '';
  showNewGroupModal = false;
  showNewChatModal = false;
  sidebarOpen = true;
  activeFilter: 'ALL' | 'PRIVATE' | 'GROUP' = 'ALL';
  searchQuery = '';

  filterTabs = [
    { label: 'All', value: 'ALL' as const },
    { label: 'Private', value: 'PRIVATE' as const },
    { label: 'Groups', value: 'GROUP' as const },
  ];

  private wsSub?: Subscription;

  constructor(
      private conversationService: ConversationService,
      private authService: AuthService,
      private webSocketService: WebSocketService  // ← inject
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.userId ?? '';

    if (this.currentUserId) {
      this.loadConversations();
      this.listenForNewMessages(); // ← start listening
    }
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  // ← Updates last message preview in real time
  private listenForNewMessages(): void {
    this.wsSub = this.webSocketService.message$.subscribe((msg: any) => {
      const conv = this.conversations.find(c => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessageContent = msg.content;
        conv.lastMessageAt = msg.createdAt;

        // Move conversation to top of list
        this.conversations = [
          conv,
          ...this.conversations.filter(c => c.id !== conv.id)
        ];
      }
    });
  }



  selectConversation(conv: ConversationDTO) {
    this.selectedConversation = conv;
  }



  openNewChatModal() { this.showNewChatModal = true; }
  closeNewChatModal() { this.showNewChatModal = false; }

  onConversationCreated(newConv: any) {
    this.loadConversations();
    this.closeNewChatModal();
    this.selectConversation(newConv);
  }

  onConversationLeft(): void {
    this.selectedConversation = null;
    this.loadConversations();
  }
  // Add this helper to your component class
  getAvatarInitial(nom: string): string {
    if (!nom || nom === 'Unnamed') return '?';
    // Handle multiple words (e.g., "Student Club" -> "SC")
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
  loadConversations() {
    this.conversationService.getAll(this.currentUserId).subscribe({
      next: (data: any[]) => {
        this.conversations = data.map(item => {
          const convData = item.conversation || item;
          return {
            ...convData,
            nom: (convData.nom && convData.nom.trim() !== '') ? convData.nom.trim() : 'Unnamed',
            lastMessageContent: item.lastMessageContent || convData.lastMessageContent || null,
            lastMessageAt: item.lastMessageAt || convData.lastMessageAt || null,
            unreadCount: item.unreadCount || 0
          } as ConversationDTO;
        }).sort((a, b) => {
          // Fix: Fallback to 0 if lastMessageAt is null so new Date() doesn't complain
          const dateA = new Date(a.lastMessageAt || 0).getTime();
          const dateB = new Date(b.lastMessageAt || 0).getTime();
          return dateB - dateA;
        });
      },
      error: (err) => console.error('Error loading conversations:', err)
    });
  }
  get filteredConversations(): ConversationDTO[] {
    return this.conversations.filter(conv => {
      const matchesFilter =
          this.activeFilter === 'ALL' ||
          conv.type === this.activeFilter;

      const matchesSearch =
          !this.searchQuery ||
          conv.nom?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          conv.lastMessageContent?.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  onConvImageError(event: any): void {
    console.warn('Failed to load conversation image:', event.target.src);
    if (event.target) {
      event.target.style.display = 'none';
    }
  }




}