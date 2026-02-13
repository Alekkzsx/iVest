import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChallengesService } from '../../services/challenges.service';
import type { UserChallenge } from '../../types/gamification.types';

@Component({
    selector: 'app-challenges-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="challenges-card">
      <div class="card-header">
        <h3 class="card-title">🎯 Desafios</h3>
        <span class="card-subtitle">Ganhe XP extra!</span>
      </div>

      <div class="challenges-list">
        @if (activeChallenges().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">🎲</span>
            <p class="empty-text">Nenhum desafio ativo no momento</p>
          </div>
        }

        @for (userChallenge of activeChallenges(); track userChallenge.challengeId) {
          @if (getChallenge(userChallenge.challengeId); as challenge) {
            <div class="challenge-item" [class.completed]="userChallenge.completed">
              <!-- Challenge Icon & Info -->
              <div class="challenge-info">
                <div class="challenge-icon">{{ challenge.icon }}</div>
                <div class="challenge-text">
                  <div class="challenge-name">{{ challenge.name }}</div>
                  <div class="challenge-desc">{{ challenge.description }}</div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="challenge-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    [style.width.%]="getProgressPercentage(userChallenge)"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ userChallenge.progress }} / {{ challenge.condition.target }}
                </div>
              </div>

              <!-- Reward & Action -->
              <div class="challenge-footer">
                <div class="reward">⚡ {{ challenge.reward.xp }} XP</div>
                @if (userChallenge.completed && !userChallenge.claimed) {
                  <button 
                    class="claim-button" 
                    (click)="claimReward(userChallenge.challengeId)"
                  >
                    Reivindicar
                  </button>
                }
                @if (userChallenge.claimed) {
                  <span class="claimed-badge">✓ Concluído</span>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
    styles: [`
    .challenges-card {
      background: white;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .card-header {
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 18px;
      font-weight: bold;
      color: #000;
      margin: 0 0 4px 0;
    }

    .card-subtitle {
      font-size: 13px;
      color: #666;
    }

    .challenges-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 32px 16px;
    }

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-text {
      color: #999;
      font-size: 14px;
      margin: 0;
    }

    .challenge-item {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .challenge-item:hover {
      border-color: #000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .challenge-item.completed {
      background: #f9fafb;
    }

    .challenge-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .challenge-icon {
      font-size: 28px;
      line-height: 1;
    }

    .challenge-text {
      flex: 1;
    }

    .challenge-name {
      font-size: 15px;
      font-weight: 600;
      color: #000;
      margin-bottom: 4px;
    }

    .challenge-desc {
      font-size: 13px;
      color: #666;
    }

    .challenge-progress {
      margin-bottom: 12px;
    }

    .progress-bar {
      background: #f0f0f0;
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .progress-fill {
      background: #000;
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 3px;
    }

    .progress-text {
      font-size: 12px;
      color: #666;
      text-align: right;
    }

    .challenge-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .reward {
      font-size: 14px;
      font-weight: 600;
      color: #000;
    }

    .claim-button {
      background: #000;
      color: white;
      border: none;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .claim-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .claimed-badge {
      font-size: 13px;
      color: #22c55e;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .challenges-card {
        padding: 16px;
      }

      .challenge-item {
        padding: 12px;
      }
    }
  `]
})
export class ChallengesCardComponent {
    private challengesService = inject(ChallengesService);

    activeChallenges = computed(() => {
        return this.challengesService.userChallenges()
            .filter(uc => !uc.claimed)
            .slice(0, 5); // Show max 5
    });

    getChallenge(challengeId: string) {
        return this.challengesService.activeChallenges()
            .find(c => c.id === challengeId);
    }

    getProgressPercentage(userChallenge: UserChallenge): number {
        const challenge = this.getChallenge(userChallenge.challengeId);
        if (!challenge) return 0;
        return Math.min((userChallenge.progress / challenge.condition.target) * 100, 100);
    }

    claimReward(challengeId: string) {
        const xp = this.challengesService.claimReward(challengeId);
        if (xp > 0) {
            console.log(`✅ Recompensa reivindicada: +${xp} XP`);
            // TODO: Show notification
        }
    }
}
