import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideCharts } from 'ng2-charts';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { register as registerSwiperElements } from 'swiper/element/bundle';

(window as any).global = window;
registerSwiperElements();

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideHttpClient(),   // 🔥 API backend
    provideCharts()        // 🔥 charts
  ]
}).catch((err) => console.error(err));