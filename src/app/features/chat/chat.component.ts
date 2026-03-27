import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-chat',
  template: `
    <div class="chat">
      <h2 class="chat__title">Chat</h2>
      <div class="chat__empty">
        <img src="assets/images/message.png" class="chat__empty-img" alt="No messages" />
        <h3 class="chat__empty-heading">No Messages Yet</h3>
        <p class="chat__empty-text">Start a conversation with your friends and family</p>
      </div>
    </div>
  `,
  styleUrl: './chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ChatComponent {}
