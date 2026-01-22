export class InstructionsOverlay {
  private element: HTMLElement;
  private isVisible: boolean = true;
  private onStart: (() => void) | null = null;

  constructor(_canvasElement?: HTMLElement, onStart?: () => void) {
    this.onStart = onStart || null;
    this.element = document.createElement('div');
    this.element.id = 'instructions-overlay';
    this.element.innerHTML = `
      <div class="title-screen">
        <div class="title-header">
          <h1 class="game-title">🌾 Country Farm Life 🌾</h1>
          <p class="subtitle">A Peaceful Voxel Farming Adventure</p>
        </div>

        <div class="story-box">
          <p class="story-text">
            <span style="font-size: 18px; display: block; margin-bottom: 10px;">📜 Your Story</span>
            The bustling city life has worn you down. The noise, the stress, the concrete jungle...
            You've decided to leave it all behind and start fresh in the peaceful countryside.
          </p>
          <p class="story-text" style="margin-top: 15px;">
            You've inherited a small farmhouse in a charming village surrounded by fields of wheat,
            carrots, and tomatoes. Your neighbors are friendly farmers who welcome you with open arms.
            The community barn stands ready, and a well sits at the heart of the village.
          </p>
          <p class="story-text highlight" style="margin-top: 15px; font-weight: bold; color: #90EE90;">
            Your new life begins now. Will you become a master farmer? 🌻
          </p>
        </div>

        <div class="start-button-container">
          <button class="start-button">🎮 Click to Start Your Farm Life 🎮</button>
        </div>

        <div class="controls-box">
          <h3 style="margin: 0 0 15px 0; color: #FFD700; font-size: 18px;">⌨️ Controls</h3>
          <div class="controls-grid">
            <div class="control-group">
              <strong style="color: #87CEEB;">Movement</strong>
              <p>WASD - Walk around</p>
              <p>Mouse - Look around</p>
              <p>Space - Fly up</p>
              <p>Shift - Fly down</p>
            </div>
            <div class="control-group">
              <strong style="color: #87CEEB;">Building</strong>
              <p>Left Click - Break block</p>
              <p>Right Click - Place block</p>
              <p>1-9 - Select materials</p>
              <p style="font-size: 11px; opacity: 0.7;">(Grass, Dirt, Stone, Cobblestone, Brick, Planks, Wood, Glass, Sand)</p>
            </div>
          </div>
          <p style="margin-top: 15px; font-size: 13px; opacity: 0.8;">Press <strong>ESC</strong> anytime to pause and see controls</p>
        </div>

        <div class="footer">
          <p style="font-size: 11px; opacity: 0.6;">Built with Three.js & Rapier Physics • Made with Claude Code</p>
        </div>
      </div>
    `;

    this.applyStyles();
    document.body.appendChild(this.element);

    // Make start button clickable to begin cinematic
    const startButton = this.element.querySelector('.start-button');
    if (startButton) {
      startButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling
        this.hide();
        if (this.onStart) {
          this.onStart();
        }
      });
    }
  }

  private applyStyles(): void {
    // Main overlay
    this.element.style.position = 'fixed';
    this.element.style.top = '0';
    this.element.style.left = '0';
    this.element.style.width = '100%';
    this.element.style.height = '100%';
    this.element.style.background = 'linear-gradient(to bottom, #1a472a 0%, #2d5a3d 50%, #4a7c59 100%)';
    this.element.style.color = 'white';
    this.element.style.display = 'flex';
    this.element.style.alignItems = 'center';
    this.element.style.justifyContent = 'center';
    this.element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    this.element.style.zIndex = '2000';
    this.element.style.overflow = 'auto';
    this.element.style.cursor = 'default';

    // Title screen container
    const titleScreen = this.element.querySelector('.title-screen') as HTMLElement;
    if (titleScreen) {
      titleScreen.style.maxWidth = '800px';
      titleScreen.style.width = '90%';
      titleScreen.style.padding = '40px';
      titleScreen.style.textAlign = 'center';
    }

    // Title header
    const gameTitle = this.element.querySelector('.game-title') as HTMLElement;
    if (gameTitle) {
      gameTitle.style.fontSize = '56px';
      gameTitle.style.margin = '0';
      gameTitle.style.textShadow = '3px 3px 6px rgba(0,0,0,0.5)';
      gameTitle.style.animation = 'pulse 2s ease-in-out infinite';
    }

    const subtitle = this.element.querySelector('.subtitle') as HTMLElement;
    if (subtitle) {
      subtitle.style.fontSize = '18px';
      subtitle.style.margin = '10px 0 30px 0';
      subtitle.style.opacity = '0.9';
      subtitle.style.fontStyle = 'italic';
    }

    // Story box
    const storyBox = this.element.querySelector('.story-box') as HTMLElement;
    if (storyBox) {
      storyBox.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
      storyBox.style.padding = '25px';
      storyBox.style.borderRadius = '15px';
      storyBox.style.marginBottom = '30px';
      storyBox.style.border = '2px solid rgba(255, 215, 0, 0.3)';
      storyBox.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    }

    const storyTexts = this.element.querySelectorAll('.story-text');
    storyTexts.forEach((text) => {
      const htmlText = text as HTMLElement;
      htmlText.style.fontSize = '15px';
      htmlText.style.lineHeight = '1.6';
      htmlText.style.margin = '0';
    });

    // Start button
    const startButton = this.element.querySelector('.start-button') as HTMLElement;
    if (startButton) {
      startButton.style.fontSize = '22px';
      startButton.style.padding = '18px 40px';
      startButton.style.backgroundColor = '#FFD700';
      startButton.style.color = '#1a472a';
      startButton.style.border = 'none';
      startButton.style.borderRadius = '50px';
      startButton.style.cursor = 'pointer';
      startButton.style.fontWeight = 'bold';
      startButton.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
      startButton.style.transition = 'all 0.3s ease';
      startButton.style.fontFamily = 'system-ui, -apple-system, sans-serif';

      startButton.onmouseover = () => {
        startButton.style.backgroundColor = '#FFF700';
        startButton.style.transform = 'scale(1.05)';
        startButton.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.6)';
      };

      startButton.onmouseout = () => {
        startButton.style.backgroundColor = '#FFD700';
        startButton.style.transform = 'scale(1)';
        startButton.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
      };
    }

    // Controls box
    const controlsBox = this.element.querySelector('.controls-box') as HTMLElement;
    if (controlsBox) {
      controlsBox.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
      controlsBox.style.padding = '20px';
      controlsBox.style.borderRadius = '12px';
      controlsBox.style.marginTop = '30px';
      controlsBox.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    }

    const controlsGrid = this.element.querySelector('.controls-grid') as HTMLElement;
    if (controlsGrid) {
      controlsGrid.style.display = 'grid';
      controlsGrid.style.gridTemplateColumns = '1fr 1fr';
      controlsGrid.style.gap = '20px';
      controlsGrid.style.marginTop = '15px';
    }

    const controlGroups = this.element.querySelectorAll('.control-group');
    controlGroups.forEach((group) => {
      const htmlGroup = group as HTMLElement;
      htmlGroup.style.textAlign = 'left';
    });

    const controlGroupPs = this.element.querySelectorAll('.control-group p');
    controlGroupPs.forEach((p) => {
      const htmlP = p as HTMLElement;
      htmlP.style.margin = '5px 0';
      htmlP.style.fontSize = '14px';
    });

    // Footer
    const footer = this.element.querySelector('.footer') as HTMLElement;
    if (footer) {
      footer.style.marginTop = '30px';
    }

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
    `;
    document.head.appendChild(style);
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
