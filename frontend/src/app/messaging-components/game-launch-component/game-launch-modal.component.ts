// src/app/messaging-components/game-launch-modal/game-launch-modal.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, CreateGameRequest } from '../../models/game.model';
import { GameService } from '../../services/Messaging/game.service';

@Component({
    selector: 'app-game-launch-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './game-launch-modal.component.html',
    styleUrls: ['./game-launch-modal.component.css']
})
export class GameLaunchModalComponent implements OnInit {
    @Output() close = new EventEmitter<void>();
    @Output() gameCreated = new EventEmitter<string>();

    @Input() conversationId: string = '';
    @Input() userId: string = '';

    categories = [
        { value: 'General Knowledge', icon: '🧠', label: 'General Knowledge' },
        { value: 'Science', icon: '🔬', label: 'Science' },
        { value: 'History', icon: '📜', label: 'History' },
        { value: 'Geography', icon: '🌍', label: 'Geography' },
        { value: 'Sports', icon: '⚽', label: 'Sports' },
        { value: 'Entertainment', icon: '🎬', label: 'Entertainment' },
        { value: 'Technology', icon: '💻', label: 'Technology' },
        { value: 'Music', icon: '🎵', label: 'Music' }
    ];

    difficulties = [
        { value: Difficulty.EASY, label: 'Easy', icon: '🟢', desc: 'More time, simpler questions' },
        { value: Difficulty.MEDIUM, label: 'Medium', icon: '🟡', desc: 'Balanced challenge' },
        { value: Difficulty.HARD, label: 'Hard', icon: '🔴', desc: 'Less time, harder questions' }
    ];

    questionCounts = [5, 10, 15, 20];
    timeLimits = [10, 15, 20, 30];

    selectedCategory = 'General Knowledge';
    selectedDifficulty = Difficulty.MEDIUM;
    selectedQuestionCount = 10;
    selectedTimeLimit = 20;
    loading = false;
    error: string | null = null;

    constructor(private gameService: GameService) {}

    // ✅ ADD: Log when inputs arrive
    ngOnInit(): void {
        console.log('🎮 GameLaunchModal ngOnInit');
        console.log('   conversationId:', this.conversationId);
        console.log('   userId:', this.userId);
    }

    createGame(): void {
        console.log('🎮 Create Game clicked');
        console.log('   conversationId:', this.conversationId);
        console.log('   userId:', this.userId);

        // ✅ FIXED: Tell user exactly what's missing
        if (!this.conversationId) {
            this.error = 'Missing conversation ID. Please close and try again.';
            console.error('❌ Missing conversationId');
            return;
        }

        if (!this.userId) {
            this.error = 'Missing user ID. Please log in again.';
            console.error('❌ Missing userId');
            return;
        }

        this.loading = true;
        this.error = null;

        const request: CreateGameRequest = {
            conversationId: this.conversationId,
            createdBy: this.userId,
            category: this.selectedCategory,
            difficulty: this.selectedDifficulty,
            totalQuestions: this.selectedQuestionCount,
            timeLimitPerQuestion: this.selectedTimeLimit
        };

        console.log('📤 Sending request:', request);

        this.gameService.createGame(request).subscribe({
            next: (game) => {
                console.log('✅ Game created:', game);
                this.loading = false;
                this.gameCreated.emit(game.id);

            },
            error: (err) => {
                console.error('❌ Failed to create game:', err);
                this.loading = false;
                this.error = err.error?.message || 'Failed to create game.';
            }
        });
    }

    closeModal(): void {
        this.close.emit();
    }
}