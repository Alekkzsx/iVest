import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Achievement } from '../../types/gamification.types';

@Component({
    selector: 'app-achievement-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="modal-overlay" 
      [class.show]="isVisible()"
      (click)="close()"
    >
      <div class="modal-content" [class.show]="isVisible()" (click)="$event.stopPropagation()">
        <!-- Achievement Icon -->
        <div class="achievement-icon">{{ achievement()?.icon }}</div>
        
        <!-- Title -->
        <h2 class="achievement-title">Conquista Desbloqueada!</h2>
        
        <!-- Achievement Name -->
        <h3 class="achievement-name">{{ achievement()?.name }}</h3>
        
        <!-- Description -->
        <p class="achievement-description">{{ achievement()?.description }}</p>
        
        <!-- XP Reward -->
        @if (achievement()?.reward?.xp) {
          <div class="xp-reward">
            <span class="xp-icon">⚡</span>
            <span class="xp-amount">+{{ achievement()?.reward?.xp }} XP</span>
          </div>
        }

        <!-- Theme Unlock -->
        @if (achievement()?.reward?.unlockTheme) {
          <div class="theme-unlock">
            🎨 Tema desbloqueado: <strong>{{ achievement()?.reward?.unlockTheme }}</strong>
          </div>
        }
        
        <!-- Close Button -->
        <button class="close-button" (click)="close()">
          Continuar
        </button>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .modal-overlay.show {
      opacity: 1;
      pointer-events: all;
    }

    .modal-content {
      background: white;
      border: 2px solid black;
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 450px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      transform: scale(0.7) translateY(-20px);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modal-content.show {
      transform: scale(1) translateY(0);
      opacity: 1;
    }

    .achievement-icon {
      font-size: 72px;
      margin-bottom: 16px;
      animation: bounce 0.6s ease infinite alternate;
    }

    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-10px); }
    }

    .achievement-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin: 0 0 12px 0;
    }

    .achievement-name {
      font-size: 26px;
      font-weight: bold;
      color: #000;
      margin: 0 0 12px 0;
    }

    .achievement-description {
      font-size: 16px;
      color: #666;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .xp-reward {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f5f5f5;
      padding: 10px 20px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 16px;
      border: 1px solid #e0e0e0;
      color: #000;
    }

    .xp-icon {
      font-size: 22px;
    }

    .theme-unlock {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 20px;
    }

    .close-button {
      background: black;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      width: 100%;
    }

    .close-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    @media (max-width: 600px) {
      .modal-content {
        padding: 32px 24px;
      }

      .achievement-icon {
        font-size: 56px;
      }

      .achievement-name {
        font-size: 22px;
      }
    }
  `]
})
export class AchievementModalComponent {
    @Input() achievement = signal<Achievement | null>(null);
    @Output() closed = new EventEmitter<void>();

    isVisible = signal(false);

    ngOnInit() {
        setTimeout(() => this.isVisible.set(true), 50);
    }

    close() {
        this.isVisible.set(false);
        setTimeout(() => this.closed.emit(), 300);
    }
}
