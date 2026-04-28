import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Theme } from '../../models/theme.model';
import { AuthService } from '../../shared/services/auth.service';
import { apiUrl } from '../../../environments/environment';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme-picker.component.html',
  styleUrls: ['./theme-picker.component.css']
})
export class ThemePickerComponent implements OnInit {

  @Input() conversationId!: string;
  @Output() close = new EventEmitter<void>();

  presets: Theme[] = [];
  loadingPresets = true;
  generating = false;

  aiPrompt = '';
  generatedTheme: Theme | null = null;

  private userId!: string;

  // Gateway‑friendly base URLs
  private readonly conversationsUrl = apiUrl('/api/conversations');

  constructor(
      private http: HttpClient,
      private authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.authService.getCurrentUser()?.userId ?? '';
    this.loadPresets();
  }

  private loadPresets() {
    this.http.get<Theme[]>(`${this.conversationsUrl}/themes/presets`)
        .subscribe({
          next: (data) => {
            this.presets = data;
            this.loadingPresets = false;
          },
          error: () => this.loadingPresets = false
        });
  }

  selectPreset(theme: Theme) {
    this.applyTheme(theme);
  }

  generateWithAI() {
    if (!this.aiPrompt.trim()) return;

    this.generating = true;
    this.generatedTheme = null;

    this.http.post<Theme>(
        `${this.conversationsUrl}/${this.conversationId}/theme/generate`,
        this.aiPrompt,
        {
          headers: {
            'Content-Type': 'text/plain',
            'userId': this.userId
          }
        }
    ).subscribe({
      next: (theme) => {
        this.generatedTheme = theme;
        this.generating = false;
      },
      error: () => {
        this.generating = false;
        alert('Erreur lors de la génération IA. Veuillez réessayer.');
      }
    });
  }

  applyGeneratedTheme() {
    if (this.generatedTheme) {
      this.applyTheme(this.generatedTheme);
    }
  }

  private applyTheme(theme: Theme) {
    this.http.put<Theme>(
        `${this.conversationsUrl}/${this.conversationId}/theme`,
        theme,
        {
          headers: { 'userId': this.userId }
        }
    ).subscribe({
      next: () => {
        this.close.emit();
      },
      error: (err) => {
        console.error(err);
        alert('Impossible d\'appliquer le thème.');
      }
    });
  }

  closeModal() {
    this.close.emit();
  }
}