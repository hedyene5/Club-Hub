// src/app/components/Game/game-question/game-question.component.ts

import {Component, Input, Output, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/Messaging/game.service';
import { QuestionEvent, SubmitAnswerRequest } from '../../models/game.model';

@Component({
    selector: 'app-game-question',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-question.component.html',
    styleUrls: ['./game-question.component.css']
})
export class GameQuestionComponent implements OnInit, OnDestroy {

    @Input() gameId: string = '';
    @Input() currentUserId: string = '';
    @Output() answerSubmitted = new EventEmitter<void>();

    question: QuestionEvent | null = null;
    selectedAnswer: string | null = null;
    answeredCount = 0;
    totalPlayers = 0;
    timeRemaining = 0;
    isSubmitting = false;
    hasAnswered = false;

    answerColors = [
        { bg: 'bg-red-500', hover: 'hover:bg-red-600', selected: 'ring-red-300 bg-red-600', shadow: 'shadow-red-200' },
        { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', selected: 'ring-blue-300 bg-blue-600', shadow: 'shadow-blue-200' },
        { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', selected: 'ring-yellow-300 bg-yellow-600', shadow: 'shadow-yellow-200' },
        { bg: 'bg-green-500', hover: 'hover:bg-green-600', selected: 'ring-green-300 bg-green-600', shadow: 'shadow-green-200' }
    ];

    answerLetters = ['A', 'B', 'C', 'D'];

    private timerInterval: any;
    private questionStartTime: number = 0;

    constructor(private gameService: GameService) {}

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.clearTimer();
    }

    setQuestion(event: QuestionEvent, totalPlayers: number): void {
        this.question = event;
        this.totalPlayers = totalPlayers;
        this.answeredCount = 0;
        this.selectedAnswer = null;
        this.hasAnswered = false;
        this.questionStartTime = Date.now();
        this.startTimer(event.timeLimit);
    }

    startTimer(seconds: number): void {
        this.clearTimer();
        this.timeRemaining = seconds;

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            if (this.timeRemaining <= 0) {
                this.clearTimer();
                if (!this.hasAnswered) {
                    this.autoSubmit();
                }
            }
        }, 1000);
    }

    clearTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    selectAnswer(answer: string): void {
        if (this.hasAnswered || this.isSubmitting) return;
        this.selectedAnswer = answer;
    }

    confirmAnswer(): void {
        if (!this.selectedAnswer || !this.question || this.hasAnswered || this.isSubmitting) return;

        this.isSubmitting = true;
        const responseTimeMs = Date.now() - this.questionStartTime;

        const request: SubmitAnswerRequest = {
            questionIndex: this.question.index,
            userId: this.currentUserId,
            selectedAnswer: this.selectedAnswer,
            responseTimeMs
        };

        this.gameService.submitAnswer(this.gameId, request).subscribe({
            next: () => {
                this.hasAnswered = true;
                this.isSubmitting = false;
                this.clearTimer();
                this.answerSubmitted.emit();
            },
            error: (err) => {
                console.error('Failed to submit answer:', err);
                this.isSubmitting = false;
            }
        });
    }

    private autoSubmit(): void {
        this.hasAnswered = true;
        this.answerSubmitted.emit();
    }

    // ✅ FIXED: Safe getters for template
    getQuestionNumber(): number {
        return this.question ? this.question.index + 1 : 1;
    }

    getTotalQuestions(): number {
        return this.question?.total ?? 0;
    }

    getQuestionText(): string {
        return this.question?.text ?? 'Loading question...';
    }

    getOptions(): string[] {
        return this.question?.options ?? [];
    }

    getTimerPercentage(): number {
        if (!this.question) return 0;
        return (this.timeRemaining / this.question.timeLimit) * 100;
    }

    getTimerColor(): string {
        if (this.timeRemaining <= 5) return 'bg-red-500';
        if (this.timeRemaining <= 10) return 'bg-yellow-500';
        return 'bg-green-500';
    }
}