import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-generator-layout',
  standalone: true,
  imports: [CommonModule], // Removed AiSidebarHistoryComponent
  templateUrl: './generator-layout.component.html',
})
export class GeneratorLayoutComponent {
  // Logic for the sidebar is gone. 
  // You only need variables here for the chat state or text input.
}