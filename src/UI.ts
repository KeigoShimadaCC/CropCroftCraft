export class InstructionsOverlay {
  private element: HTMLElement;
  private isVisible: boolean = true;

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'instructions-overlay';
    this.element.innerHTML = `
      <div class="instructions-content">
        <h1>VoxelPhysics</h1>
        <h2>Controls</h2>
        <div class="control-section">
          <p><strong>Click</strong> to start playing</p>
        </div>
        <div class="control-section">
          <p><strong>WASD</strong> - Move</p>
          <p><strong>Mouse</strong> - Look around</p>
          <p><strong>Space</strong> - Move up</p>
          <p><strong>Shift</strong> - Move down</p>
        </div>
        <div class="control-section">
          <p><strong>Left Click</strong> - Destroy block</p>
          <p><strong>Right Click</strong> - Place block</p>
          <p><strong>1-4</strong> - Select block type</p>
        </div>
        <div class="control-section">
          <p><strong>ESC</strong> - Show/hide controls</p>
        </div>
      </div>
    `;

    this.applyStyles();
    document.body.appendChild(this.element);
  }

  private applyStyles(): void {
    this.element.style.position = 'fixed';
    this.element.style.top = '0';
    this.element.style.left = '0';
    this.element.style.width = '100%';
    this.element.style.height = '100%';
    this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.element.style.color = 'white';
    this.element.style.display = 'flex';
    this.element.style.alignItems = 'center';
    this.element.style.justifyContent = 'center';
    this.element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    this.element.style.zIndex = '2000';
    this.element.style.cursor = 'pointer';

    // Style the content container
    const content = this.element.querySelector('.instructions-content') as HTMLElement;
    if (content) {
      content.style.textAlign = 'center';
      content.style.maxWidth = '500px';
      content.style.padding = '40px';
    }

    // Style headings
    const h1 = this.element.querySelector('h1') as HTMLElement;
    if (h1) {
      h1.style.fontSize = '48px';
      h1.style.marginBottom = '30px';
      h1.style.fontWeight = 'bold';
    }

    const h2 = this.element.querySelector('h2') as HTMLElement;
    if (h2) {
      h2.style.fontSize = '24px';
      h2.style.marginBottom = '20px';
      h2.style.borderBottom = '2px solid white';
      h2.style.paddingBottom = '10px';
    }

    // Style control sections
    const sections = this.element.querySelectorAll('.control-section');
    sections.forEach((section) => {
      const htmlSection = section as HTMLElement;
      htmlSection.style.marginBottom = '20px';
      htmlSection.style.padding = '10px';
    });

    // Style paragraphs
    const paragraphs = this.element.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const htmlP = p as HTMLElement;
      htmlP.style.margin = '8px 0';
      htmlP.style.fontSize = '16px';
    });
  }

  show(): void {
    this.isVisible = true;
    this.element.style.display = 'flex';
  }

  hide(): void {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  getIsVisible(): boolean {
    return this.isVisible;
  }
}
