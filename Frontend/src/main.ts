import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { register as registerSwiperElements } from 'swiper/element/bundle';

// Polyfill for SockJS / older libs (required by some dependencies)
(window as any).global = window;

// ── Game components (barrel exports for messaging module) ──
export * from './app/messaging-components/game-launch-component/game-launch-modal.component';
export * from './app/messaging-components/Game Banner Component/game-banner.component';
export * from './app/messaging-components/Game Question Screen Component/game-question.component';
export * from './app/messaging-components/answer-reveal/answer-reveal.component';
export * from './app/messaging-components/game-leaderboard/game-leaderboard.component';
export * from './app/messaging-components/game-container/game-container.component';

registerSwiperElements();

bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));