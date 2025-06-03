export type MessageType = 'success' | 'error' | 'info';

export class MessageService {
  private static readonly MESSAGE_DURATION = 5000;

  static show(text: string, type: MessageType): void {
    const messageEl = document.querySelector('#message');
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.className = `message ${type}`;

      // Clear message after specified duration
      setTimeout(() => {
        this.clear();
      }, this.MESSAGE_DURATION);
    }
  }

  static clear(): void {
    const messageEl = document.querySelector('#message');
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }
  }
}
