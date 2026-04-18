import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { register as registerSwiperElements } from 'swiper/element/bundle';
// src/app/components/Game/index.ts

export * from './app/messaging-components/game-launch-component/game-launch-modal.component'; // gamelaunch
export * from './app/messaging-components/Game Banner Component/game-banner.component'; // game banner
export * from './app/messaging-components/Game Question Screen Component/game-question.component'; // game questions
export * from './app/messaging-components/answer-reveal/answer-reveal.component';//answer reveal
export * from './app/messaging-components/game-leaderboard/game-leaderboard.component';//leaderboard
export * from './app/messaging-components/game-container/game-container.component';// game container
registerSwiperElements();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
