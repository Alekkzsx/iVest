import { Injectable, signal } from '@angular/core';
import type {
    Challenge,
    UserChallenge,
    ChallengeType,
} from '../types/gamification.types';

@Injectable({
    providedIn: 'root',
})
export class ChallengesService {
    // Desafios ativos
    activeChallenges = signal<Challenge[]>([]);

    // Progresso do usuário nos desafios
    userChallenges = signal<UserChallenge[]>([]);

    constructor() {
        console.log('🎯 ChallengesService inicializado');
        // Gerar desafios iniciais
        this.generateDailyChallenges();
        this.generateWeeklyChallenges();
    }

    /**
     * Gerar desafios diários
     */
    generateDailyChallenges(): void {
        const now = Date.now();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailyChallenges: Challenge[] = [
            {
                id: `daily_10_questions_${new Date().toISOString().split('T')[0]}`,
                name: 'Estudo Diário',
                description: 'Responda 10 questões hoje',
                icon: '📚',
                type: 'daily',
                condition: { type: 'answer_questions', target: 10 },
                reward: { xp: 100 },
                expiresAt: endOfDay.getTime(),
            },
            {
                id: `daily_5_streak_${new Date().toISOString().split('T')[0]}`,
                name: 'Sequência Perfeita',
                description: 'Acerte 5 questões seguidas',
                icon: '🎯',
                type: 'daily',
                condition: { type: 'perfect_streak', target: 5 },
                reward: { xp: 150 },
                expiresAt: endOfDay.getTime(),
            },
        ];

        // Adicionar desafio de matéria aleatória
        const subjects = ['Matemática', 'Português', 'Ciências', 'História', 'Geografia'];
        const subjectIcons: Record<string, string> = {
            'Matemática': '📐',
            'Português': '📖',
            'Ciências': '🧪',
            'História': '🌍',
            'Geografia': '🗺️'
        };
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];

        dailyChallenges.push({
            id: `daily_subject_${randomSubject}_${new Date().toISOString().split('T')[0]}`,
            name: `Foco em ${randomSubject}`,
            description: `Estude ${randomSubject} hoje`,
            icon: subjectIcons[randomSubject],
            type: 'daily',
            condition: { type: 'subject_study', target: 5, subject: randomSubject },
            reward: { xp: 100 },
            expiresAt: endOfDay.getTime(),
        });

        this.activeChallenges.update(challenges => {
            // Remover desafios diários antigos
            const filtered = challenges.filter(c => c.type !== 'daily');
            return [...filtered, ...dailyChallenges];
        });

        console.log(`📅 Desafios diários gerados: ${dailyChallenges.length}`);
    }

    /**
     * Gerar desafios semanais
     */
    generateWeeklyChallenges(): void {
        const now = Date.now();
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyChallenges: Challenge[] = [
            {
                id: `weekly_100_questions_${Math.floor(now / (1000 * 60 * 60 * 24 * 7))}`,
                name: 'Maratona Semanal',
                description: 'Responda 100 questões nesta semana',
                icon: '🏃',
                type: 'weekly',
                condition: { type: 'answer_questions', target: 100 },
                reward: { xp: 500 },
                expiresAt: endOfWeek.getTime(),
            },
            {
                id: `weekly_7_day_streak_${Math.floor(now / (1000 * 60 * 60 * 24 * 7))}`,
                name: 'Consistência Total',
                description: 'Mantenha streak por 7 dias',
                icon: '🔥',
                type: 'weekly',
                condition: { type: 'streak', target: 7 },
                reward: { xp: 300 },
                expiresAt: endOfWeek.getTime(),
            },
        ];

        this.activeChallenges.update(challenges => {
            // Remover desafios semanais antigos
            const filtered = challenges.filter(c => c.type !== 'weekly');
            return [...filtered, ...weeklyChallenges];
        });

        console.log(`📆 Desafios semanais gerados: ${weeklyChallenges.length}`);
    }

    /**
     * Atualizar progresso de um desafio
     */
    updateProgress(challengeId: string, increment: number = 1): void {
        this.userChallenges.update(challenges => {
            const existing = challenges.find(c => c.challengeId === challengeId);

            if (existing) {
                // Atualizar progresso existente
                const challenge = this.activeChallenges().find(c => c.id === challengeId);
                if (!challenge) return challenges;

                const newProgress = Math.min(
                    existing.progress + increment,
                    challenge.condition.target
                );
                const completed = newProgress >= challenge.condition.target;

                return challenges.map(c =>
                    c.challengeId === challengeId
                        ? {
                            ...c,
                            progress: newProgress,
                            completed,
                            completedAt: completed && !c.completed ? Date.now() : c.completedAt,
                        }
                        : c
                );
            } else {
                // Criar novo tracking
                const challenge = this.activeChallenges().find(c => c.id === challengeId);
                if (!challenge) return challenges;

                const completed = increment >= challenge.condition.target;

                return [
                    ...challenges,
                    {
                        challengeId,
                        progress: increment,
                        completed,
                        completedAt: completed ? Date.now() : undefined,
                        claimed: false,
                    },
                ];
            }
        });
    }

    /**
     * Reivindicar recompensa de desafio completado
     */
    claimReward(challengeId: string): number {
        const userChallenge = this.userChallenges().find(c => c.challengeId === challengeId);
        const challenge = this.activeChallenges().find(c => c.id === challengeId);

        if (!userChallenge || !challenge || !userChallenge.completed || userChallenge.claimed) {
            return 0;
        }

        // Marcar como reivindicado
        this.userChallenges.update(challenges =>
            challenges.map(c =>
                c.challengeId === challengeId ? { ...c, claimed: true } : c
            )
        );

        console.log(`✅ Desafio completado: ${challenge.name} (+${challenge.reward.xp} XP)`);
        return challenge.reward.xp;
    }

    /**
     * Verificar e atualizar desafios baseado em ações do usuário
     */
    checkChallenges(action: {
        type: 'answer_question' | 'perfect_streak' | 'complete_quiz' | 'study_subject';
        subject?: string;
        consecutiveCorrect?: number;
    }): void {
        const active = this.activeChallenges();

        for (const challenge of active) {
            const userChallenge = this.userChallenges().find(
                c => c.challengeId === challenge.id
            );

            // Não atualizar se já completou
            if (userChallenge?.completed) continue;

            // Verificar se a ação corresponde ao desafio
            switch (challenge.condition.type) {
                case 'answer_questions':
                    if (action.type === 'answer_question') {
                        this.updateProgress(challenge.id, 1);
                    }
                    break;

                case 'perfect_streak':
                    if (action.type === 'perfect_streak' && action.consecutiveCorrect) {
                        // Atualizar para o máximo alcançado
                        this.userChallenges.update(challenges => {
                            const existing = challenges.find(c => c.challengeId === challenge.id);
                            const newProgress = action.consecutiveCorrect || 0;

                            if (existing) {
                                const completed = newProgress >= challenge.condition.target;
                                return challenges.map(c =>
                                    c.challengeId === challenge.id
                                        ? {
                                            ...c,
                                            progress: Math.max(c.progress, newProgress),
                                            completed,
                                            completedAt: completed && !c.completed ? Date.now() : c.completedAt,
                                        }
                                        : c
                                );
                            } else {
                                const completed = newProgress >= challenge.condition.target;
                                return [
                                    ...challenges,
                                    {
                                        challengeId: challenge.id,
                                        progress: newProgress,
                                        completed,
                                        completedAt: completed ? Date.now() : undefined,
                                        claimed: false,
                                    },
                                ];
                            }
                        });
                    }
                    break;

                case 'complete_quizzes':
                    if (action.type === 'complete_quiz') {
                        this.updateProgress(challenge.id, 1);
                    }
                    break;

                case 'subject_study':
                    if (
                        action.type === 'study_subject' &&
                        action.subject === challenge.condition.subject
                    ) {
                        this.updateProgress(challenge.id, 1);
                    }
                    break;
            }
        }
    }

    /**
     * Remover desafios expirados
     */
    removeExpiredChallenges(): void {
        const now = Date.now();

        this.activeChallenges.update(challenges =>
            challenges.filter(c => c.expiresAt > now)
        );

        this.userChallenges.update(challenges => {
            const activeIds = this.activeChallenges().map(c => c.id);
            return challenges.filter(c => activeIds.includes(c.challengeId));
        });
    }

    /**
     * Obter número da semana do ano
     */
    private getWeekNumber(): number {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now.getTime() - start.getTime();
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek);
    }

    /**
     * Carregar desafios do usuário do backend
     */
    loadUserChallenges(challenges: UserChallenge[]): void {
        this.userChallenges.set(challenges);
    }

    /**
     * Obter desafios não reivindicados completados
     */
    getUnclaimedRewards(): Challenge[] {
        const unclaimed = this.userChallenges().filter(
            uc => uc.completed && !uc.claimed
        );

        return unclaimed
            .map(uc => this.activeChallenges().find(c => c.id === uc.challengeId))
            .filter(Boolean) as Challenge[];
    }
}
