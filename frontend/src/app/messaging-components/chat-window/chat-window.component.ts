import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConversationDTO } from "../../models/conversation.model";
import { MessageDTO } from "../../models/message.model";
import { MessageService } from "../../services/Messaging/message.service";
import { MessageInputComponent } from "../message-input/message-input.component";
import { ParticipantsPanelComponent } from "../ participants-panel/participants-panel.component";
import { ConversationService } from "../../services/Messaging/conversation.service";
import { WebSocketService } from "../../services/Messaging/websocket.service";
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import {ReactionService} from "../../services/Messaging/ReactionService";
import {IMessage, StompSubscription} from "@stomp/stompjs";
import { ChangeDetectorRef } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {GameWebSocketService} from "../../services/Messaging/game-websocket.service";
import {GameContainerComponent} from "../game-container/game-container.component";
import {GameLaunchModalComponent} from "../game-launch-component/game-launch-modal.component";
import {GameBannerComponent} from "../Game Banner Component/game-banner.component";
import { Theme } from "../../models/theme.model";
import { ThemeService } from "../../services/Messaging/theme.service";
import {ThemePickerComponent} from "../theme-picker/theme-picker.component";

@Component({
    selector: 'app-chat-window',
    standalone: true,
    imports: [CommonModule, MessageInputComponent, ParticipantsPanelComponent, FormsModule, GameContainerComponent, GameLaunchModalComponent, GameBannerComponent, ThemePickerComponent],
    templateUrl: './chat-window.component.html',
    styleUrls: ['./chat-window.component.css'],
    host: { class: 'flex flex-col flex-1 min-h-0 overflow-hidden' }
})
export class ChatWindowComponent implements OnChanges,  OnDestroy {
    // Add this property with your other boolean flags
    showThemePicker = false;
    // Add these properties to the class
    showGameLaunchModal = false;
    gamePhase: 'BANNER' | 'PLAYING' | null = null;
    // Add these properties
    showReactionsModal = false;
    modalMessage: MessageDTO | null = null;
    activeReactionFilter: string | null = null; // null = "Tout"

    private reactionSubs: StompSubscription[] = [];
    showEmojiPickerForId: string | null = null;
    replyingTo: MessageDTO | null = null;
    openMenuId: string | null = null;
    editingMessageId: string | null = null;
    editContent = '';
    private shouldAutoScroll = true;
    private userIsScrolling = false;
    @Input() conversation: ConversationDTO | null = null;
    @Input() currentUserId: string = '';
    @Output() conversationLeft = new EventEmitter<void>();

    messages: MessageDTO[] = [];
    loading = false;
    showParticipants = false;

    private wsSub?: Subscription;
    gameModalConversationId: string = '';
    gameModalUserId: string = '';


    localGameData: { gameId: string; category: string; totalQuestions: number; timeLimitPerQuestion: number; createdBy: string } | null = null;
    private themeSubscription?: Subscription;

    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
    @ViewChild(GameLaunchModalComponent) gameLaunchModal?: GameLaunchModalComponent;
    constructor(
        private messageService: MessageService,
        private conversationService: ConversationService,
        private webSocketService: WebSocketService,
        private reactionService: ReactionService,
         private cdr: ChangeDetectorRef,
        private themeService: ThemeService,

        private gameWsService: GameWebSocketService
    ) {
        this.webSocketService.connect();
    }
    // Emoji map for display
    readonly emojiMap: Record<string, string> = {
        LIKE: '👍',
        LOVE: '❤️',
        HAHA: '😂',
        NOTBAD: '😮',
        GREATJOB: '🎉'
    };

    ngOnChanges(changes: SimpleChanges) {
        if (changes['conversation'] && this.conversation) {
            if (this.wsSub) this.wsSub.unsubscribe();

            this.loadMessages();
            this.subscribeToWebSocket(this.conversation.id);

            // Reset game state when switching conversations
            this.gamePhase = null;
            this.localGameData = null;

            // Subscribe to game WebSocket for this conversation
            this.gameWsService.subscribeToGameEvents(this.conversation.id);

            // Listen to game events to drive banner/game for ALL users
            this.gameWsService.gameEvent$.subscribe((event: any) => {
                if (!event) return;

                switch (event.type) {
                    case 'GAME_CREATED':
                        // Only show banner if no game is currently active
                        if (this.gamePhase === null) {
                            this.gamePhase = 'BANNER';
                        }
                        break;

                    case 'GAME_STARTED':
                        this.gamePhase = 'PLAYING';
                        this.localGameData = null;
                        break;

                    case 'GAME_OVER':
                        // Keep PLAYING so leaderboard screen shows inside game-container
                        // game-container will handle the LEADERBOARD phase internally
                        // Reset to null only when user clicks "close" or "play again"
                        break;
                }
            });
            if (this.themeSubscription) this.themeSubscription.unsubscribe();
            this.themeSubscription = this.webSocketService.themeUpdated$.subscribe((newTheme: Theme | null) => {
                if (newTheme) {
                    this.themeService.applyTheme(newTheme);
                }
            });
            if (this.conversation.theme) {
                this.themeService.setInitialTheme(this.conversation.theme);
            }

        }
    }



    // Update ngOnDestroy to unsubscribe from game events
    ngOnDestroy() {
        this.wsSub?.unsubscribe();
        this.themeSubscription?.unsubscribe();
        this.reactionSubs.forEach(s => s.unsubscribe());
        this.gameWsService.unsubscribeFromGameEvents();  // ← ADD THIS
    }
    private subscribeToWebSocket(conversationId: string): void {
        this.webSocketService.subscribeToConversation(conversationId);

        this.wsSub = this.webSocketService.message$.subscribe((msg: any) => {
            if (msg.conversationId !== conversationId) return;

            // Check if this is an edit (message already exists)
            const existingIndex = this.messages.findIndex(m => m.id === msg.id);

            if (existingIndex !== -1) {
                // ← UPDATE existing message (edit/delete)
                this.messages[existingIndex] = msg;
            } else {
                // ← NEW message — skip if it's our own (already added optimistically)
                const isOwnMessage = msg.senderId === this.currentUserId;
                if (!isOwnMessage) {
                    this.messages.push(msg);
                    setTimeout(() => this.scrollToBottom(), 50);
                    this.loadReactionsForMessage(msg.id);
                    this.subscribeToSingleReaction(msg.id);
                }
            }
        });
    }

    private loadMessages() {
        if (!this.conversation?.id || !this.currentUserId) return;

        this.loading = true;

        this.messageService.getMessagesByConversation(this.conversation.id, this.currentUserId)
            .subscribe({
                next: (msgs) => {
                    this.messages = msgs || [];
                    this.loading = false;
                    setTimeout(() => {         // ← ensure messages are rendered before loading reactions
                        this.loadAllReactions();
                        this.subscribeToReactions();
                        this.forceScrollToBottom();
                    }, 0);

                },
                error: (err) => {
                    console.error('Failed to load messages:', err);
                    this.loading = false;
                }
            });
    }

    onSendMessage(content: string) {
        if (!this.conversation || !content.trim()) return;

        const parentId = this.replyingTo?.id ?? null;

        const optimisticMsg: MessageDTO = {
            id: 'temp-' + Date.now(),
            content,
            senderId: this.currentUserId,
            senderName: 'You',
            createdAt: new Date().toISOString(),
            conversationId: this.conversation.id,
            parentMessageId: parentId ?? undefined,
            parentMessageContent: this.replyingTo?.content
        };

        this.messages.push(optimisticMsg);
        this.forceScrollToBottom();
        this.replyingTo = null; // ← clear reply

        this.messageService.sendMessage(
            this.conversation.id,
            this.currentUserId,
            content,
            parentId  // ← pass it
        ).subscribe({
            next: (realMsg) => {
                const index = this.messages.findIndex(m => m.id.startsWith('temp-'));
                if (index !== -1) this.messages[index] = realMsg;
                this.loadReactionsForMessage(realMsg.id);
                // Also subscribe to future reaction updates
                this.subscribeToSingleReaction(realMsg.id);
            },
            error: (err) => {
                console.error('Failed to send message', err);
                this.messages = this.messages.filter(m => !m.id.startsWith('temp-'));
            }
        });
    }

    private scrollToBottom(): void {
        if (!this.messagesContainer) return;

        const container = this.messagesContainer.nativeElement;

        // Only auto-scroll if user is at the bottom or just sent a message
        if (!this.userIsScrolling) {
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }, 10);
        }
    }
    onMessagesScroll() {
        const container = this.messagesContainer.nativeElement;
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

        this.shouldAutoScroll = isAtBottom;
    }


    isMine(msg: MessageDTO): boolean {
        return msg.senderId === this.currentUserId;
    }
    deleteConversationForMe() {
        if (!this.conversation?.id || !this.currentUserId) return;

        const isGroup = this.conversation.type === 'GROUP';
        const confirmMsg = isGroup
            ? 'Leave this group? All current messages will disappear for you only.'
            : 'Archive this conversation? All current messages will disappear for you only.';

        if (!confirm(confirmMsg)) return;

        this.conversationService.hideMessagesForUser(this.conversation.id, this.currentUserId)
            .subscribe({
                next: () => {
                    this.messages = [];                    // ← Clear old messages immediately
                    this.loadMessages();                   // ← Reload visible messages
                },
                error: (err) => {
                    console.error(err);
                    alert('Action failed. Please try again.');
                }
            });
    }
    onScroll() {
        const container = this.messagesContainer.nativeElement;
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

        this.userIsScrolling = distanceFromBottom > 150;   // User scrolled up more than 150px
    }
    private forceScrollToBottom() {
        this.userIsScrolling = false;
        this.scrollToBottom();
    }
    startEditing(msg: MessageDTO) {
        if (msg.senderId !== this.currentUserId) return;

        this.editingMessageId = msg.id;
        this.editContent = msg.content;
    }
    saveEdit() {
        if (!this.editingMessageId || !this.editContent.trim() || !this.conversation) return;

        const messageId = this.editingMessageId;
        const newContent = this.editContent.trim();

        this.messageService.updateMessage(this.conversation.id, messageId, newContent)
            .subscribe({
                next: (updatedMsg) => {
                    // Update local list immediately
                    const index = this.messages.findIndex(m => m.id === messageId);
                    if (index !== -1) {
                        this.messages[index] = updatedMsg;
                    }
                    this.cancelEdit();
                },
                error: (err) => {
                    console.error('Failed to update message', err);
                    alert('Failed to edit message. Please try again.');
                    this.cancelEdit();
                }
            });
    }
    cancelEdit() {
        this.editingMessageId = null;
        this.editContent = '';
    }


    toggleMenu(messageId: string) {
        this.openMenuId = this.openMenuId === messageId ? null : messageId;
    }



    deleteMessage(messageId: string) {
        if (!this.conversation) return;
        if (!confirm('Delete this message?')) return;

        this.messageService.deleteMessage(this.conversation.id, messageId)
            .subscribe({
                next: (deletedMsg) => {
                    // Update locally — backend does soft delete, content becomes "Ce message a été supprimé."
                    const index = this.messages.findIndex(m => m.id === messageId);
                    if (index !== -1) {
                        this.messages[index] = deletedMsg;
                    }
                    this.openMenuId = null;

                    // Broadcast via WebSocket so others see it deleted in real time
                    this.webSocketService.sendMessage(
                        this.conversation!.id,
                        this.currentUserId,
                        deletedMsg.content  // "Ce message a été supprimé."
                    );
                },
                error: (err) => {
                    console.error('Failed to delete message', err);
                    alert('Failed to delete message.');
                }
            });
    }
    replyTo(msg: MessageDTO) {
        this.replyingTo = msg;
        this.openMenuId = null;
    }
    cancelReply() {
        this.replyingTo = null;
    }
    scrollToMessage(messageId: string) {
        const element = document.getElementById('msg-' + messageId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Optional: Add a brief highlight effect like Messenger
            element.classList.add('bg-blue-50/50');
            setTimeout(() => element.classList.remove('bg-blue-50/50'), 1500);
        }
    }
    toggleEmojiPicker(messageId: string, event: Event) {
        event.stopPropagation();
        this.showEmojiPickerForId =
            this.showEmojiPickerForId === messageId ? null : messageId;
    }
    react(msg: MessageDTO, emoji: string) {
        if (!this.conversation) return;

        this.reactionService.toggleReaction(
            this.conversation.id, msg.id, this.currentUserId, emoji
        ).subscribe({
            next: (reactions) => {
                console.log('✅ Reaction toggle success for message', msg.id, reactions);
                msg.reactions = reactions;
                this.showEmojiPickerForId = null;
                // Force UI update
                this.messages = [...this.messages];
            },
            error: (err) => console.error('❌ Failed to toggle reaction', err)
        });
    }
    getGroupedReactions(msg: MessageDTO): { emoji: string, count: number, hasMe: boolean }[] {
        if (!msg.reactions || msg.reactions.length === 0) return [];

        const groups: Record<string, { count: number, hasMe: boolean }> = {};

        for (const r of msg.reactions) {
            const key = r.emoji;
            if (!groups[key]) {
                groups[key] = { count: 0, hasMe: false };
            }
            groups[key].count++;
            if (r.userId === this.currentUserId) {
                groups[key].hasMe = true;
            }
        }

        return Object.entries(groups).map(([emoji, data]) => ({
            emoji: this.emojiMap[emoji] || emoji,
            count: data.count,
            hasMe: data.hasMe
        }));
    }
    getEmojiKey(emojiChar: string): string {
        return Object.entries(this.emojiMap)
            .find(([, v]) => v === emojiChar)?.[0] ?? emojiChar;
    }
    private subscribeToReactions(): void {
        // Clean old subscriptions
        this.reactionSubs.forEach(s => s.unsubscribe());
        this.reactionSubs = [];

        this.messages.forEach(msg => {
            if (!msg.id) return;

            const topic = `/topic/reactions/${msg.id}`;

            const sub = this.webSocketService.subscribeToTopic(
                topic,
                (data: any) => {                    // ← data is already parsed!
                    console.log('🔴 LIVE REACTION UPDATE received:', data);

                    const target = this.messages.find(m => m.id === data.messageId);
                    if (target) {
                        target.reactions = data.reactions || [];
                        console.log('✅ Reactions updated on message', data.messageId);
                    } else {
                        console.warn('Target message not found:', data.messageId);
                    }
                }
            );

            if (sub) this.reactionSubs.push(sub);
        });
    }
    getMessageBubbleClass(msg: MessageDTO): string {
        const isMine = msg.senderId === this.currentUserId;

        if (msg.deleted) {
            return 'msg-bubble-deleted rounded-2xl px-4 py-2';
        }

        return isMine
            ? 'msg-bubble-mine rounded-2xl rounded-tr-sm px-4 py-2.5'
            : 'msg-bubble-other rounded-2xl rounded-tl-sm px-4 py-2.5';
    }

    private subscribeToSingleReaction(messageId: string): void {
        const topic = `/topic/reactions/${messageId}`;
        const sub = this.webSocketService.subscribeToTopic(
            topic,
            (data: any) => {                    // ← data is already parsed object
                console.log('🔴 LIVE REACTION UPDATE received (already parsed):', data);

                if (!data || !data.messageId) {
                    console.warn('Invalid reaction data received');
                    return;
                }

                const target = this.messages.find(m => m.id === data.messageId);
                if (target) {
                    target.reactions = data.reactions || [];
                    console.log('✅ Reactions updated on message', data.messageId, data.reactions);
                } else {
                    console.warn('Target message not found for reaction update:', data.messageId);
                }
            }
        );
        if (sub) this.reactionSubs.push(sub);
    }
    private loadAllReactions() {
        const validMessages = this.messages.filter(m => m.id && !m.id.startsWith('temp-'));
        if (!validMessages.length || !this.conversation?.id) return;

        const requests = validMessages.map(msg =>
            this.reactionService.getReactions(this.conversation!.id, msg.id).pipe(
                catchError(() => of([]))
            )
        );

        forkJoin(requests).subscribe(allReactions => {
            allReactions.forEach((reactions, i) => {
                validMessages[i].reactions = reactions || [];
            });
            this.messages = [...this.messages]; // new reference = Angular re-renders
            this.cdr.detectChanges();
        });
    }
    private loadReactionsForMessage(messageId: string): void {
        if (!this.conversation?.id) return;

        this.reactionService.getReactions(this.conversation.id, messageId).subscribe({
            next: (reactions) => {
                const targetMsg = this.messages.find(m => m.id === messageId);
                if (targetMsg) {
                    targetMsg.reactions = reactions || [];
                    // trigger change detection (immutable update)
                    this.messages = [...this.messages];
                }
            },
            error: (err) => console.error(`Failed to load reactions for message ${messageId}`, err)
        });
    }
    trackByMessageId(index: number, msg: MessageDTO) {
        return msg.id;
    }
    openReactionsModal(msg: MessageDTO, event: Event) {
        event.stopPropagation();
        this.modalMessage = msg;
        this.activeReactionFilter = null;
        this.showReactionsModal = true;
    }

    closeReactionsModal() {
        this.showReactionsModal = false;
        this.modalMessage = null;
        this.activeReactionFilter = null;
    }
    getFilteredReactions() {
        if (!this.modalMessage?.reactions) return [];
        if (!this.activeReactionFilter) return this.modalMessage.reactions;
        return this.modalMessage.reactions.filter(r => r.emoji === this.activeReactionFilter);
    }
    getModalTabs() {
        if (!this.modalMessage?.reactions) return [];
        const groups: Record<string, number> = {};
        for (const r of this.modalMessage.reactions) {
            groups[r.emoji] = (groups[r.emoji] || 0) + 1;
        }
        return Object.entries(groups).map(([emoji, count]) => ({
            emoji,
            display: this.emojiMap[emoji] || emoji,
            count
        }));
    }


    closeGameLaunchModal(): void {
        this.showGameLaunchModal = false;
    }

    onGameStarted(): void {
        this.gamePhase = 'PLAYING';
        this.localGameData = null; // Clear local data when game starts
    }

    onBannerDismissed(): void {
        this.gamePhase = null;
        this.localGameData = null;
    }
    // In chat-window.component.ts

    openGameLaunchModal(): void {
        // ✅ FIXED: Store values in local variables FIRST
        this.gameModalConversationId = this.conversation?.id || '';
        this.gameModalUserId = this.currentUserId;

        console.log('🎮 Opening game modal');
        console.log('   Stored conversationId:', this.gameModalConversationId);
        console.log('   Stored userId:', this.gameModalUserId);

        if (!this.gameModalConversationId || !this.gameModalUserId) {
            console.error('❌ Cannot open - missing IDs');
            return;
        }

        this.showGameLaunchModal = true;
    }
    onGameCreated(gameId: string): void {
        this.localGameData = {
            gameId: gameId,
            category: 'General Knowledge',
            totalQuestions: 10,        // ← was totalQ
            timeLimitPerQuestion: 20,  // ← was timeLimit
            createdBy: this.currentUserId
        };
        this.gamePhase = 'BANNER';
        this.showGameLaunchModal = false;
    }



}