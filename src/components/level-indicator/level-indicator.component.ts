import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentService } from '../../services/content.service';
import { LEVEL_TITLES } from '../../types/gamification.types';

@Component({
    selector: 'app-level-indicator',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="level-indicator">
      <!-- Level Badge -->
      <div class="level-badge">
        <span class="level-number">{{ currentLevel() }}</span>
      </div>

      <!-- Level Info -->
      <div class="level-info">
        <div class="level-title">{{ levelTitle() }}</div>
        <div class="level-progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              [style.width.%]="progressPercentage()"
            ></div>
          </div>
          <div class="xp-text">{{ currentXP() }} / {{ nextLevelXP() }} XP</div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .level-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .level-indicator:hover {
      border-color: #000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .level-badge {
      background: #000;
      color: white;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      flex-shrink: 0;
    }

    .level-info {
      flex: 1;
      min-width: 0;
    }

    .level-title {
      font-size: 14px;
      font-weight: 600;
      color: #000;
      margin-bottom: 6px;
    }

    .level-progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      flex: 1;
      background: #f0f0f0;
      height: 4px;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      background: #000;
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 2px;
    }

    .xp-text {
      font-size: 11px;
      color: #666;
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .level-indicator {
        padding: 10px 12px;
      }

      .level-badge {
        width: 40px;
        height: 40px;
        font-size: 16px;
      }

      .level-title {
        font-size: 13px;
      }

      .xp-text {
        font-size: 10px;
      }
    }
  `]
})
export class LevelIndicatorComponent {
    private contentService = inject(ContentService);

    stats = this.contentService.stats;

    currentLevel = computed(() => this.stats().level);
    currentXP = computed(() => this.stats().xp % 1000);
    nextLevelXP = computed(() => 1000);
    progressPercentage = computed(() => (this.currentXP() / this.nextLevelXP()) * 100);

    levelTitle = computed(() => {
        const level = this.currentLevel();
        if (level <= 5) return LEVEL_TITLES[0];
        if (level <= 10) return LEVEL_TITLES[1];
        if (level <= 20) return LEVEL_TITLES[2];
        if (level <= 35) return LEVEL_TITLES[3];
        if (level <= 50) return LEVEL_TITLES[4];
        return LEVEL_TITLES[5];
    });
}
