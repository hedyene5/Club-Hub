import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameOverEvent, LeaderboardEntry } from '../../models/game.model';

@Component({
    selector: 'app-game-leaderboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-leaderboard.component.html',
    styleUrls: ['./game-leaderboard.component.css']
})
export class GameLeaderboardComponent implements  OnDestroy, OnChanges {

    @Input() event: GameOverEvent | null = null;
    @Input() currentUserId: string = '';
    @Input() conversationId: string = '';

    @Output() playAgain = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();

    displayedSummary = '';
    isTypingSummary = false;
    showConfetti = true;

    podiumPlayers: [LeaderboardEntry | null, LeaderboardEntry | null, LeaderboardEntry | null] = [null, null, null];
    sortedLeaderboard: LeaderboardEntry[] = [];

    private typingInterval: any;

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['event'] && this.event?.leaderboard) {
            console.log('📊 Leaderboard ngOnChanges - processing data');

            this.processLeaderboard();

            // Reset and start confetti + typewriter
            this.showConfetti = true;
            setTimeout(() => this.showConfetti = false, 6000);

            // Start typewriter with a small delay to let DOM settle
            setTimeout(() => {
                const summary = this.event?.aiSummary?.trim() || "What an incredible match! Well played everyone.";
                this.startSummaryTypewriter(summary);
            }, 400);
        }
    }

    ngOnDestroy(): void {
        this.clearTypingInterval();
    }

    private processLeaderboard(): void {
        if (!this.event?.leaderboard?.length) {
            this.sortedLeaderboard = [];
            this.podiumPlayers = [null, null, null];
            return;
        }

        // Sort by rank (safest)
        this.sortedLeaderboard = [...this.event.leaderboard].sort((a, b) => a.rank - b.rank);

        // Podium: 2nd, 1st, 3rd (as you designed)
        this.podiumPlayers = [
            this.sortedLeaderboard.find(p => p.rank === 2) || null,
            this.sortedLeaderboard.find(p => p.rank === 1) || null,
            this.sortedLeaderboard.find(p => p.rank === 3) || null
        ];
    }

    private startSummaryTypewriter(text: string): void {
        this.clearTypingInterval();
        this.displayedSummary = '';
        this.isTypingSummary = true;

        let index = 0;
        const speed = 30; // ms per character

        this.typingInterval = setInterval(() => {
            if (index < text.length) {
                this.displayedSummary += text[index];
                index++;
                this.cdr.markForCheck();   // ← CRITICAL for typewriter
            } else {
                this.isTypingSummary = false;
                this.clearTypingInterval();
                this.cdr.markForCheck();
            }
        }, speed);
    }

    private clearTypingInterval(): void {
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
    }

    getRankEmoji(rank: number): string {
        switch (rank) {
            case 1: return '👑';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏅';
        }
    }
}