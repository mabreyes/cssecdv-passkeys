export class SecurityService {
  static initialize(): void {
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Disable keyboard shortcuts for inspect element and dev tools
    document.addEventListener('keydown', (e) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I / Cmd+Shift+I
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'i'
      ) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+J / Cmd+Shift+J
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'j'
      ) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+C / Cmd+Shift+C
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'c'
      ) {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+U / Cmd+U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        return false;
      }
    });

    // Additional protection against dev tools
    SecurityService.detectDevTools();
  }

  private static detectDevTools(): void {
    // Create hidden element to detect dev tools
    const element = document.createElement('div');
    Object.assign(element.style, {
      position: 'fixed',
      top: '-99px',
      left: '-99px',
      width: '1px',
      height: '1px',
      opacity: '0',
    });
    document.body.appendChild(element);

    // Check for dev tools being open
    const devToolsCheck = (): void => {
      const heightThreshold = 4;
      const widthThreshold = 4;

      if (
        window.outerHeight - window.innerHeight > heightThreshold ||
        window.outerWidth - window.innerWidth > widthThreshold
      ) {
        // Optional: Add additional actions when dev tools are detected
        console.clear(); // Clear console
      }
    };

    // Run checks periodically
    setInterval(devToolsCheck, 1000);

    // Also check on resize events
    window.addEventListener('resize', devToolsCheck);
  }
}
