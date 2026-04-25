import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar-widget',
  template: `
    <div class="mx-auto mb-10 w-full max-w-60 rounded-2xl px-4 py-4 text-center"
         style="background: linear-gradient(135deg, #1C2340 0%, #2d3561 100%);">
      <div class="flex items-center justify-center gap-1 mb-1">
        <span style="font-family:'Arial Black',Arial,sans-serif;font-size:14px;font-weight:900;color:#fff;letter-spacing:0.5px">CLUB</span>
        <span style="font-family:'Arial Black',Arial,sans-serif;font-size:14px;font-weight:900;color:#E84068;letter-spacing:0.5px">HUB</span>
      </div>
      <p style="font-size:10px;color:#9CA3AF;margin:0;">Module Trésorerie — v1.0</p>
    </div>
  `
})
export class SidebarWidgetComponent {}
