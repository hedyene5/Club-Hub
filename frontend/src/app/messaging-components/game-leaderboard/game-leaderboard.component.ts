// src/app/components/Game/game-leaderboard/game-leaderboard.component.ts

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameOverEvent, LeaderboardEntry } from '../../models/game.model';

@Component({
    selector: 'app-game-leaderboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-leaderboard.component.html',
    styleUrls: ['./game-leaderboard.component.css']
})
export class GameLeaderboardComponent implements OnInit, OnDestroy, OnChanges {
    @Input() event: GameOverEvent | null = null;
    @Input() currentUserId: string = '';
    @Input() conversationId: string = '';
    @Output() playAgain = new EventEmitter<void>();
    @Output() close = new EventEmitter<void>();

    displayedSummary = '';
    isTypingSummary = false;
    showConfetti = true;
    private typingInterval: any;

    podiumPlayers: [LeaderboardEntry | null, LeaderboardEntry | null, LeaderboardEntry | null] = [null, null, null];
    otherPlayers: LeaderboardEntry[] = [];
    myRank: LeaderboardEntry | null = null;

    // ✅ FIXED: Add a sorted property to use in template
    sortedLeaderboard: LeaderboardEntry[] = [];

    ngOnInit(): void {

    }

    // ✅ FIXED: Add OnChanges to handle input changes
    ngOnChanges(changes: SimpleChanges): void {
        console.log('📊 Leaderboard ngOnChanges:', changes['event']?.currentValue);
        if (changes['event'] && this.event) {
            this.processLeaderboard();
            this.showConfetti = true;
            setTimeout(() => { this.showConfetti = false; }, 5000);
            setTimeout(() => {
                const summary = this.event?.aiSummary || 'Great game everyone!';
                console.log('📊 Starting typewriter with:', summary.substring(0, 50));
                this.startSummaryTypewriter(summary);
            }, 300);
        }
    }

    ngOnDestroy(): void {
        this.clearTypingInterval();
    }

    private processLeaderboard(): void {
        if (!this.event?.leaderboard) {
            this.sortedLeaderboard = [];
            return;
        }

        const sorted = [...this.event.leaderboard].sort((a, b) => a.rank - b.rank);

        // ✅ FIXED: Store the sorted array
        this.sortedLeaderboard = sorted;

        // Podium: [2nd, 1st, 3rd] for visual display
        this.podiumPlayers = [
            sorted.find(p => p.rank === 2) || null,
            sorted.find(p => p.rank === 1) || null,
            sorted.find(p => p.rank === 3) || null
        ];

        // Other players (rank > 3)
        this.otherPlayers = sorted.filter(p => p.rank > 3);

        // Find current user's rank
        this.myRank = sorted.find(p => p.userId === this.currentUserId) || null;
    }

    private startSummaryTypewriter(text: string): void {
        this.clearTypingInterval();
        this.displayedSummary = '';
        this.isTypingSummary = true;
        let index = 0;

        this.typingInterval = setInterval(() => {
            if (index < text.length) {
                this.displayedSummary += text[index];
                index++;
            } else {
                this.isTypingSummary = false;
                this.clearTypingInterval();
            }
        }, 25);
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