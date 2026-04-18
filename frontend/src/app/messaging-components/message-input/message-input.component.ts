import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerComponent],
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.css']
})
export class MessageInputComponent {
  messageText = '';
  showEmojiPicker = false;
  customEmojis: any[] = []; // Your future custom list

  @Output() send = new EventEmitter<string>();

  handleEmojiSelect(event: any) {
    // Uses native unicode if available, otherwise the colon code
    this.messageText += event.emoji.native || `:${event.emoji.id}:`;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  onSend() {
    if (this.messageText.trim()) {
      this.send.emit(this.messageText.trim());
      this.messageText = '';
      this.showEmojiPicker = false;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      this.onSend();
    }
  }
}