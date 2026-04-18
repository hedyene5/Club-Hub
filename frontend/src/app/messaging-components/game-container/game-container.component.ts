import { Component, Input, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameWebSocketService } from '../../services/Messaging/game-websocket.service';
import {
    GameEvent,
    QuestionEvent,
    AnswerRevealEvent,
    GameOverEvent,
} from '../../models/game.model';
import { GameQuestionComponent } from '../Game Question Screen Component/game-question.component';
import { AnswerRevealComponent } from '../answer-reveal/answer-reveal.component';
import { GameLeaderboardComponent } from '../game-leaderboard/game-leaderboard.component';

@Component({
    selector: 'app-game-container',
    standalone: true,
    imports: [CommonModule, GameQuestionComponent, AnswerRevealComponent, GameLeaderboardComponent],
    templateUrl: './game-container.component.html',
    styleUrls: ['./game-container.component.css']
})
export class GameContainerComponent implements OnInit, OnDestroy {
    @ViewChild('questionComp') questionComponent?: GameQuestionComponent;

    @Input() currentUserId: string = '';
    @Input() conversationId: string = '';

    gameId: string = '';
    gamePhase: 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | null = null;

    currentQuestion: QuestionEvent | null = null;
    selectedAnswer: string | null = null;
    totalPlayers = 0;

    revealEvent: AnswerRevealEvent | null = null;
    leaderboardEvent: GameOverEvent | null = null;

    private wsSub?: Subscription;
    private pendingQuestion: QuestionEvent | null = null;

    constructor(private gameWsService: GameWebSocketService) {}

    ngOnInit(): void {
        this.wsSub = this.gameWsService.gameEvent$.subscribe((event: any) => {
            if (!event) return;
            this.handleGameEvent(event);
        });
    }

    ngOnDestroy(): void {
        this.wsSub?.unsubscribe();
    }

    private handleGameEvent(event: any): void {
        console.log('🎮 GameContainer received:', event.type, event);

        switch (event.type) {
            case 'GAME_STARTED':
                this.gameId = event.gameId;
                this.gamePhase = null; // Wait for QUESTION event
                break;

            case 'QUESTION':
                const q: QuestionEvent = {
                    type: 'QUESTION',
                    index: event.index,
                    text: event.text,
                    options: event.options,
                    timeLimit: event.timeLimit,
                    total: event.total
                };
                this.handleQuestion(q);
                break;

            case 'PLAYER_ANSWERED':
                this.totalPlayers = event.totalPlayers;
                if (this.questionComponent) {
                    this.questionComponent.answeredCount = event.answeredCount;
                    this.questionComponent.totalPlayers = event.totalPlayers;
                }
                break;

            case 'ANSWER_REVEAL':
                // Capture selected answer before switching phase
                if (this.questionComponent) {
                    this.selectedAnswer = this.questionComponent.selectedAnswer;
                    this.questionComponent.clearTimer();
                }
                this.revealEvent = {
                    type: 'ANSWER_REVEAL',
                    correctAnswer: event.correctAnswer,
                    aiFunFact: event.aiFunFact,
                    scores: event.scores
                };
                this.currentQuestion = null;
                this.gamePhase = 'REVEAL';
                break;

            case 'GAME_OVER':
                this.leaderboardEvent = {
                    type: 'GAME_OVER',
                    leaderboard: event.leaderboard,
                    aiSummary: event.aiSummary
                };
                this.gamePhase = 'LEADERBOARD';
                break;
        }
    }

    private handleQuestion(question: QuestionEvent): void {
        // Store it — we'll pass it to the child once it's rendered
        this.pendingQuestion = question;
        this.currentQuestion = question;
        this.selectedAnswer = null;
        this.revealEvent = null;
        this.leaderboardEvent = null;
        this.gamePhase = 'QUESTION';

        // setTimeout gives Angular one cycle to render *ngIf="gamePhase === 'QUESTION'"
        // before we try to call methods on the child component
        setTimeout(() => {
            if (this.questionComponent && this.pendingQuestion) {
                this.questionComponent.setQuestion(this.pendingQuestion, this.totalPlayers);
                this.pendingQuestion = null;
            }
        }, 150);
    }

    onAnswerSubmitted(): void {
        if (this.questionComponent) {
            this.selectedAnswer = this.questionComponent.selectedAnswer;
        }
    }

    onPlayAgain(): void {
        this.gamePhase = null;
        this.gameId = '';
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.revealEvent = null;
        this.leaderboardEvent = null;
        this.pendingQuestion = null;
    }

    onCloseGame(): void {
        this.gamePhase = null;
    }
}