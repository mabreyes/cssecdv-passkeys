/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
export interface EventCallbacks {
  onRegister: () => Promise<void>;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  onUsernameInput: (event: Event) => void;
}

export class EventHandler {
  private callbacks: EventCallbacks;

  constructor(callbacks: EventCallbacks) {
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Use event delegation since we're re-rendering the DOM
    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const closeButton = target.closest('#close-modal');

      if (target.id === 'register-btn') {
        e.preventDefault();
        e.stopPropagation();
        try {
          await this.callbacks.onRegister();
        } catch (error) {
          console.error('Register callback error:', error);
        }
      } else if (target.id === 'login-btn') {
        e.preventDefault();
        e.stopPropagation();
        try {
          await this.callbacks.onLogin();
        } catch (error) {
          console.error('Login callback error:', error);
        }
      } else if (target.id === 'logout-btn') {
        e.preventDefault();
        e.stopPropagation();
        this.callbacks.onLogout();
      } else if (target.id === 'learn-more-btn') {
        e.preventDefault();
        e.stopPropagation();
        this.openModal();
      } else if (closeButton || target.classList.contains('modal-overlay')) {
        e.preventDefault();
        e.stopPropagation();
        this.closeModal();
      } else if (target.classList.contains('modal-tab')) {
        e.preventDefault();
        e.stopPropagation();
        this.handleTabClick(target as HTMLElement);
      } else if (target.id === 'scroll-left') {
        e.preventDefault();
        e.stopPropagation();
        this.scrollTabsLeft();
      } else if (target.id === 'scroll-right') {
        e.preventDefault();
        e.stopPropagation();
        this.scrollTabsRight();
      }
    });

    // Listen for username input changes
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLElement;

      if (target.id === 'username') {
        this.callbacks.onUsernameInput(e);
      }
    });

    // Prevent form submissions that might cause page refresh
    document.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Form submission prevented');
    });

    // Prevent any accidental form submissions from Enter key
    document.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;

        // If Enter is pressed in the username field, try to register (if valid)
        if (target.id === 'username') {
          e.preventDefault();
          const registerBtn = document.querySelector('#register-btn') as any;
          if (registerBtn && !registerBtn.hasAttribute('disabled')) {
            try {
              await this.callbacks.onRegister();
            } catch (error) {
              console.error('Register via Enter key error:', error);
            }
          }
        }
      } else if (e.key === 'Escape') {
        // Close modal on Escape key
        this.closeModal();
      }
    });
  }

  private openModal(): void {
    const modal = document.getElementById('passkeys-modal');
    if (modal) {
      modal.classList.add('modal-open');
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';

      // Initialize tabs
      this.initializeTabs();

      // Initialize scroll indicators
      setTimeout(() => {
        this.setupScrollIndicators();
      }, 100);

      // Focus trap - focus the close button
      const closeBtn = modal.querySelector('#close-modal') as HTMLElement;
      if (closeBtn) {
        closeBtn.focus();
      }
    }
  }

  private closeModal(): void {
    const modal = document.getElementById('passkeys-modal');
    if (modal && modal.classList.contains('modal-open')) {
      modal.classList.remove('modal-open');
      // Restore body scrolling
      document.body.style.overflow = '';

      // Clean up scroll listeners
      this.cleanupScrollIndicators();

      // Return focus to the learn more button
      const learnMoreBtn = document.getElementById(
        'learn-more-btn'
      ) as HTMLElement;
      if (learnMoreBtn) {
        learnMoreBtn.focus();
      }
    }
  }

  private initializeTabs(): void {
    // Set up initial tab state
    const tabs = document.querySelectorAll('.modal-tab');
    const sections = document.querySelectorAll('.education-section[id]');

    // Hide all sections except intro
    sections.forEach((section, index) => {
      const sectionElement = section as HTMLElement;
      if (index === 0) {
        sectionElement.style.display = 'block';
      } else {
        sectionElement.style.display = 'none';
      }
    });

    // Set intro tab as active
    tabs.forEach((tab, index) => {
      tab.classList.toggle('active', index === 0);
    });
  }

  private handleTabClick(tab: HTMLElement): void {
    const sectionId = tab.dataset.section;
    if (!sectionId) return;

    // Update active tab
    const tabs = document.querySelectorAll('.modal-tab');
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    // Show corresponding section
    const sections = document.querySelectorAll('.education-section[id]');
    sections.forEach((section) => {
      const sectionElement = section as HTMLElement;
      if (section.id === `section-${sectionId}`) {
        sectionElement.style.display = 'block';
        // Scroll to top of modal body
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
          modalBody.scrollTop = 0;
        }
      } else {
        sectionElement.style.display = 'none';
      }
    });
  }

  private setupScrollIndicators(): void {
    const tabsContainer = document.getElementById('modal-tabs-container');
    if (!tabsContainer) return;

    // Update scroll indicators on scroll
    tabsContainer.addEventListener('scroll', () => {
      this.updateScrollIndicators();
    });

    // Update on window resize
    window.addEventListener('resize', () => {
      this.updateScrollIndicators();
    });

    // Initial update
    this.updateScrollIndicators();
  }

  private updateScrollIndicators(): void {
    const tabsContainer = document.getElementById('modal-tabs-container');
    const leftBtn = document.getElementById('scroll-left');
    const rightBtn = document.getElementById('scroll-right');

    if (!tabsContainer || !leftBtn || !rightBtn) return;

    const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;
    const hasOverflow = scrollWidth > clientWidth;

    // Show/hide left button
    if (scrollLeft <= 0 || !hasOverflow) {
      leftBtn.classList.add('hidden');
      leftBtn.style.opacity = '0';
      leftBtn.style.pointerEvents = 'none';
      leftBtn.style.visibility = 'hidden';
    } else {
      leftBtn.classList.remove('hidden');
      leftBtn.style.opacity = '1';
      leftBtn.style.pointerEvents = 'auto';
      leftBtn.style.visibility = 'visible';
    }

    // Show/hide right button
    if (scrollLeft >= scrollWidth - clientWidth - 1 || !hasOverflow) {
      rightBtn.classList.add('hidden');
      rightBtn.style.opacity = '0';
      rightBtn.style.pointerEvents = 'none';
      rightBtn.style.visibility = 'hidden';
    } else {
      rightBtn.classList.remove('hidden');
      rightBtn.style.opacity = '1';
      rightBtn.style.pointerEvents = 'auto';
      rightBtn.style.visibility = 'visible';
    }
  }

  private scrollTabsLeft(): void {
    const tabsContainer = document.getElementById('modal-tabs-container');
    if (!tabsContainer) return;

    const scrollAmount = 200; // Adjust scroll distance as needed
    tabsContainer.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth',
    });
  }

  private scrollTabsRight(): void {
    const tabsContainer = document.getElementById('modal-tabs-container');
    if (!tabsContainer) return;

    const scrollAmount = 200; // Adjust scroll distance as needed
    tabsContainer.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }

  private cleanupScrollIndicators(): void {
    // Remove the resize listener when modal closes
    // Note: The scroll listeners on the tabs container will be automatically cleaned up
    // when the DOM is re-rendered, but we could add specific cleanup here if needed
  }
}
