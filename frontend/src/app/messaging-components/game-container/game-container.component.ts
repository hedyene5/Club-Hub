import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GameWebSocketService } from '../../services/Messaging/game-websocket.service';
import {
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
    // References for View Interaction
    @ViewChild('questionComp') questionComponent?: GameQuestionComponent;
    @ViewChild('fullscreenContainer') fullscreenContainer!: ElementRef;

    // Inputs from Parent (Chat/Main View)
    @Input() currentUserId: string = '';
    @Input() conversationId: string = '';

    // Game State Management
    gameId: string = '';
    gamePhase: 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | null = null;
    isFullscreen: boolean = false;

    // Data Models for Phases
    currentQuestion: QuestionEvent | null = null;
    selectedAnswer: string | null = null;
    totalPlayers: number = 0;

    revealEvent: AnswerRevealEvent | null = null;
    leaderboardEvent: GameOverEvent | null = null;

    // Internal Helpers
    private wsSub?: Subscription;
    private pendingQuestion: QuestionEvent | null = null;

    constructor(private gameWsService: GameWebSocketService) {}

    ngOnInit(): void {
        // Subscribe to real-time game events
        this.wsSub = this.gameWsService.gameEvent$.subscribe((event: any) => {
            if (event) this.handleGameEvent(event);
        });

        // Listen for browser fullscreen changes (e.g., user presses ESC)
        document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.onFullscreenChange.bind(this));
    }

    ngOnDestroy(): void {
        this.wsSub?.unsubscribe();
        document.removeEventListener('fullscreenchange', this.onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange);
    }

    /**
     * Core Event Router
     */
    private handleGameEvent(event: any): void {
        console.log(`[GameEvent] Type: ${event.type}`, event);

        switch (event.type) {
            case 'GAME_STARTED':
                this.gameId = event.gameId;
                this.gamePhase = null; // Awaiting first QUESTION event
                break;

            case 'QUESTION':
                this.handleQuestionPhase(event);
                break;

            case 'PLAYER_ANSWERED':
                this.totalPlayers = event.totalPlayers;
                if (this.questionComponent) {
                    this.questionComponent.answeredCount = event.answeredCount;
                    this.questionComponent.totalPlayers = event.totalPlayers;
                }
                break;

            case 'ANSWER_REVEAL':
                this.handleRevealPhase(event);
                break;

            case 'GAME_OVER':
                this.handleGameOverPhase(event);
                break;
        }
    }

    /**
     * Phase Handlers
     */
    private handleQuestionPhase(event: any): void {
        const q: QuestionEvent = {
            type: 'QUESTION',
            index: event.index,
            text: event.text,
            options: event.options,
            timeLimit: event.timeLimit,
            total: event.total
        };

        this.pendingQuestion = q;
        this.currentQuestion = q;
        this.selectedAnswer = null;
        this.revealEvent = null;
        this.leaderboardEvent = null;
        this.gamePhase = 'QUESTION';

        // Brief timeout to ensure the child component is rendered via *ngIf
        setTimeout(() => {
            if (this.questionComponent && this.pendingQuestion) {
                this.questionComponent.setQuestion(this.pendingQuestion, this.totalPlayers);
                this.pendingQuestion = null;
            }
        }, 150);
    }

    private handleRevealPhase(event: any): void {
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
    }

    private handleGameOverPhase(event: any): void {
        this.leaderboardEvent = {
            type: 'GAME_OVER',
            leaderboard: event.leaderboard,
            aiSummary: event.aiSummary
        };
        this.gamePhase = 'LEADERBOARD';
    }

    /**
     * UI Actions
     */
    onAnswerSubmitted(): void {
        if (this.questionComponent) {
            this.selectedAnswer = this.questionComponent.selectedAnswer;
        }
    }

    onPlayAgain(): void {
        this.resetState();
    }

    onCloseGame(): void {
        if (this.isFullscreen) {
            this.exitFullscreen();
        }
        this.resetState();
    }

    private resetState(): void {
        this.gamePhase = null;
        this.gameId = '';
        this.currentQuestion = null;
        this.selectedAnswer = null;
        this.revealEvent = null;
        this.leaderboardEvent = null;
        this.pendingQuestion = null;
    }

    /**
     * Fullscreen Logic
     */
    toggleFullscreen(): void {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    private enterFullscreen(): void {
        const elem = this.fullscreenContainer.nativeElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(); // Safari
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen(); // IE11
        }
    }

    private exitFullscreen(): void {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        }
    }

    private onFullscreenChange(): void {
        this.isFullscreen = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
    }
}