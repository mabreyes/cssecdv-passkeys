export type MessageType = 'success' | 'error' | 'info';

export class MessageService {
  private static readonly MESSAGE_DURATION = 10000; // 10 seconds
  private static readonly FADE_DURATION = 500; // 500ms fade
  private static currentTimeout: number | null = null;
  private static clickHandler: ((event: Event) => void) | null = null;

  static show(text: string, type: MessageType): void {
    const messageEl = document.querySelector('#message') as HTMLElement;
    if (messageEl) {
      // Clear any existing timeout
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }

      // Remove existing click handler
      if (this.clickHandler) {
        messageEl.removeEventListener('click', this.clickHandler);
      }

      // Set message content and type - support HTML content
      messageEl.innerHTML = text;
      messageEl.className = `message ${type}`;

      // Ensure message is visible (remove any fade-out class)
      messageEl.classList.remove('fade-out');
      messageEl.style.opacity = '1';

      // Add progress indicator
      this.addProgressIndicator(messageEl);

      // Add click to dismiss functionality
      this.addClickToDismiss(messageEl);

      // Start fade-out after the display duration
      this.currentTimeout = window.setTimeout(() => {
        this.fadeOut();
      }, this.MESSAGE_DURATION - this.FADE_DURATION);
    }
  }

  private static addProgressIndicator(messageEl: HTMLElement): void {
    // Remove any existing progress indicator
    const existingProgress = messageEl.querySelector('.message-progress');
    if (existingProgress) {
      existingProgress.remove();
    }

    // Create progress indicator
    const progressEl = document.createElement('div');
    progressEl.className = 'message-progress';
    progressEl.innerHTML = '<div class="message-progress-bar"></div>';

    messageEl.appendChild(progressEl);

    // Start progress animation
    const progressBar = progressEl.querySelector(
      '.message-progress-bar'
    ) as HTMLElement;
    if (progressBar) {
      progressBar.style.animationDuration = `${this.MESSAGE_DURATION}ms`;
      progressBar.classList.add('progress-animate');
    }
  }

  private static addClickToDismiss(messageEl: HTMLElement): void {
    // Add click handler directly
    this.clickHandler = () => {
      this.hide();
    };
    messageEl.addEventListener('click', this.clickHandler);

    // Add visual hint for clickability
    messageEl.style.cursor = 'pointer';
    messageEl.title = 'Click to dismiss';
  }

  private static fadeOut(): void {
    const messageEl = document.querySelector('#message') as HTMLElement;
    if (messageEl) {
      // Add fade-out class for CSS transition
      messageEl.classList.add('fade-out');

      // Clear message content after fade completes
      setTimeout(() => {
        if (messageEl.classList.contains('fade-out')) {
          this.clear();
        }
      }, this.FADE_DURATION);
    }
  }

  static clear(): void {
    const messageEl = document.querySelector('#message') as HTMLElement;
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.className = 'message';
      messageEl.classList.remove('fade-out');
      messageEl.style.opacity = '1';

      // Clear any pending timeout
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }
    }
  }

  // Method to immediately hide message without waiting for timeout
  static hide(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    this.fadeOut();
  }
}
