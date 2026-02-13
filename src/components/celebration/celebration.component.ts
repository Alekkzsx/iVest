import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CelebrationType = 'correct' | 'streak' | 'completion' | 'achievement';

@Component({
  selector: 'app-celebration',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="celebration-overlay" 
      [class.show]="isVisible()"
      (click)="close()"
    >
      <!-- Confetti Animation -->
      <div class="confetti-container">
        @for (confetti of confettiPieces; track confetti.id) {
          <div 
            class="confetti" 
            [style.left.%]="confetti.left"
            [style.animation-delay.s]="confetti.delay"
            [style.background-color]="confetti.color"
          ></div>
        }
      </div>

      <!-- Success Message -->
      <div class="celebration-content" [class.show]="isVisible()">
        <!-- Icon -->
        <div class="celebration-icon">{{ icon() }}</div>
        
        <!-- Title -->
        <h2 class="celebration-title">{{ title() }}</h2>
        
        <!-- Message -->
        @if (message()) {
          <p class="celebration-message">{{ message() }}</p>
        }

        <!-- XP Earned (if any) -->
        @if (xpEarned > 0) {
          <div class="xp-badge">
            <span class="xp-icon">⚡</span>
            <span class="xp-amount">+{{ xpEarned }} XP</span>
          </div>
        }

        <!-- Continue Button -->
        @if (showButton()) {
          <button class="celebration-button" (click)="close()">
            {{ buttonText() }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .celebration-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .celebration-overlay.show {
      opacity: 1;
      pointer-events: all;
    }

    /* Confetti Animation - cores minimalistas */
    .confetti-container {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }

    .confetti {
      position: absolute;
      width: 8px;
      height: 8px;
      top: -10px;
      animation: confetti-fall 2.5s linear forwards;
      border-radius: 2px;
    }

    @keyframes confetti-fall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }

    /* Content - Estilo VestBot */
    .celebration-content {
      background: white;
      border: 2px solid black;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      transform: scale(0.8);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .celebration-content.show {
      transform: scale(1);
      opacity: 1;
    }

    .celebration-icon {
      font-size: 64px;
      margin-bottom: 16px;
      animation: bounce 0.6s ease infinite alternate;
    }

    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-8px); }
    }

    .celebration-title {
      font-size: 28px;
      font-weight: bold;
      margin: 0 0 8px 0;
      color: #000;
    }

    .celebration-message {
      font-size: 16px;
      margin: 0 0 20px 0;
      color: #666;
    }

    .xp-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f5f5f5;
      padding: 10px 20px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      border: 1px solid #e0e0e0;
      color: #000;
    }

    .xp-icon {
      font-size: 22px;
      animation: pulse 1s ease infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }

    .celebration-button {
      background: black;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .celebration-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    /* Responsive */
    @media (max-width: 600px) {
      .celebration-content {
        padding: 32px 24px;
      }

      .celebration-icon {
        font-size: 52px;
      }

      .celebration-title {
        font-size: 22px;
      }

      .celebration-message {
        font-size: 14px;
      }
    }
  `]
})
export class CelebrationComponent {
  @Input() type: CelebrationType = 'correct';
  @Input() xpEarned = 0;
  @Input() customTitle?: string;
  @Input() customMessage?: string;
  @Input() autoClose = true;
  @Input() autoCloseDelay = 2000;

  @Output() closed = new EventEmitter<void>();

  // Getter para usar no template
  get xpEarnedValue(): number {
    return this.xpEarned;
  }

  isVisible = signal(false);
  confettiPieces: Array<{ id: number; left: number; delay: number; color: string }> = [];

  icon = signal('🎉');
  title = signal('Parabéns!');
  message = signal('');
  showButton = signal(false);
  buttonText = signal('Continuar');

  ngOnInit() {
    this.setupCelebration();
    this.generateConfetti();

    // Show animation
    setTimeout(() => this.isVisible.set(true), 10);

    // Auto-close if enabled
    if (this.autoClose && this.type !== 'completion') {
      setTimeout(() => this.close(), this.autoCloseDelay);
    }
  }

  setupCelebration() {
    switch (this.type) {
      case 'correct':
        this.icon.set('✨');
        this.title.set(this.customTitle || this.getRandomCorrectMessage());
        this.message.set(this.customMessage || '');
        this.showButton.set(false);
        break;

      case 'streak':
        this.icon.set('🔥');
        this.title.set(this.customTitle || 'Sequência Incrível!');
        this.message.set(this.customMessage || 'Continue assim!');
        this.showButton.set(false);
        break;

      case 'completion':
        this.icon.set('🎊');
        this.title.set(this.customTitle || 'Simulado Completo!');
        this.message.set(this.customMessage || 'Você terminou todas as questões!');
        this.showButton.set(true);
        this.buttonText.set('Ver Resultado');
        break;

      case 'achievement':
        this.icon.set('🏆');
        this.title.set(this.customTitle || 'Conquista Desbloqueada!');
        this.message.set(this.customMessage || '');
        this.showButton.set(true);
        this.buttonText.set('Continuar');
        break;
    }
  }

  generateConfetti() {
    // Cores minimalistas do VestBot: preto, branco, cinzas
    const colors = ['#000000', '#FFFFFF', '#333333', '#666666', '#999999', '#CCCCCC'];
    const count = 40; // Menos confetes para look mais clean

    for (let i = 0; i < count; i++) {
      this.confettiPieces.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  getRandomCorrectMessage(): string {
    const messages = [
      'Muito bem!',
      'Excelente!',
      'Perfeito!',
      'Incrível!',
      'Mandou bem!',
      'Arrasou!',
      'Certíssimo!',
      'Show! 👏',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  close() {
    this.isVisible.set(false);
    setTimeout(() => this.closed.emit(), 300);
  }
}
