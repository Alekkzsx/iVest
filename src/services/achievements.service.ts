import { Injectable, signal } from '@angular/core';
import type {
    Achievement,
    UserAchievement,
    AchievementCondition,
} from '../types/gamification.types';

@Injectable({
    providedIn: 'root',
})
export class AchievementsService {
    // Lista de todas as conquistas disponíveis
    private readonly ALL_ACHIEVEMENTS: Achievement[] = [
        // ========== PRIMEIRAS VITÓRIAS ==========
        {
            id: 'first_victory',
            name: 'Primeira Vitória',
            description: 'Acerte sua primeira questão',
            icon: '🏆',
            condition: { type: 'questions_answered', target: 1 },
            reward: { xp: 50 },
        },
        {
            id: 'dedicated_student',
            name: 'Estudante Dedicado',
            description: 'Responda 100 questões',
            icon: '📚',
            condition: { type: 'questions_answered', target: 100 },
            reward: { xp: 200 },
        },
        {
            id: 'question_master',
            name: 'Mestre das Questões',
            description: 'Responda 500 questões',
            icon: '🎓',
            condition: { type: 'questions_answered', target: 500 },
            reward: { xp: 500 },
        },
        {
            id: 'legend',
            name: 'Lenda',
            description: 'Responda 1000 questões',
            icon: '🌟',
            condition: { type: 'questions_answered', target: 1000 },
            reward: { xp: 1000 },
        },

        // ========== STREAKS ==========
        {
            id: 'flame_beginner',
            name: 'Chama Iniciante',
            description: 'Mantenha streak por 3 dias',
            icon: '🔥',
            condition: { type: 'streak', target: 3 },
            reward: { xp: 100 },
        },
        {
            id: 'flame_lit',
            name: 'Chama Acesa',
            description: 'Mantenha streak por 7 dias',
            icon: '🔥',
            condition: { type: 'streak', target: 7 },
            reward: { xp: 300 },
        },
        {
            id: 'lightning',
            name: 'Relâmpago',
            description: 'Mantenha streak por 14 dias',
            icon: '⚡',
            condition: { type: 'streak', target: 14 },
            reward: { xp: 500 },
        },
        {
            id: 'unstoppable',
            name: 'Imparável',
            description: 'Mantenha streak por 30 dias',
            icon: '💪',
            condition: { type: 'streak', target: 30 },
            reward: { xp: 1000 },
        },

        // ========== PERFEIÇÃO ==========
        {
            id: 'perfectionist',
            name: 'Perfeccionista',
            description: '100% de acerto em 10 questões consecutivas',
            icon: '💯',
            condition: { type: 'perfect_run', target: 10 },
            reward: { xp: 200 },
        },
        {
            id: 'infallible',
            name: 'Infalível',
            description: '100% de acerto em 20 questões consecutivas',
            icon: '🎯',
            condition: { type: 'perfect_run', target: 20 },
            reward: { xp: 500 },
        },

        // ========== ESPECIALISTA POR MATÉRIA ==========
        {
            id: 'math_expert',
            name: 'Expert em Matemática',
            description: '90%+ de acerto em 50 questões de Matemática',
            icon: '📐',
            condition: { type: 'subject_mastery', target: 50, subject: 'Matemática' },
            reward: { xp: 300 },
        },
        {
            id: 'portuguese_master',
            name: 'Mestre em Português',
            description: '90%+ de acerto em 50 questões de Português',
            icon: '📖',
            condition: { type: 'subject_mastery', target: 50, subject: 'Português' },
            reward: { xp: 300 },
        },
        {
            id: 'scientist',
            name: 'Cientista',
            description: '90%+ de acerto em 50 questões de Ciências',
            icon: '🧪',
            condition: { type: 'subject_mastery', target: 50, subject: 'Ciências' },
            reward: { xp: 300 },
        },
        {
            id: 'historian',
            name: 'Historiador',
            description: '90%+ de acerto em 50 questões de História',
            icon: '🌍',
            condition: { type: 'subject_mastery', target: 50, subject: 'História' },
            reward: { xp: 300 },
        },
        {
            id: 'geographer',
            name: 'Geógrafo',
            description: '90%+ de acerto em 50 questões de Geografia',
            icon: '🗺️',
            condition: { type: 'subject_mastery', target: 50, subject: 'Geografia' },
            reward: { xp: 300 },
        },

        // ========== NÍVEIS ==========
        {
            id: 'level_10',
            name: 'Nível 10',
            description: 'Alcance o nível 10',
            icon: '⭐',
            condition: { type: 'level', target: 10 },
            reward: { xp: 100, unlockTheme: 'dark_premium' },
        },
        {
            id: 'level_25',
            name: 'Nível 25',
            description: 'Alcance o nível 25',
            icon: '⭐⭐',
            condition: { type: 'level', target: 25 },
            reward: { xp: 250, unlockTheme: 'etec_blue' },
        },
        {
            id: 'etec_master',
            name: 'Mestre ETEC',
            description: 'Alcance o nível 50',
            icon: '⭐⭐⭐',
            condition: { type: 'level', target: 50 },
            reward: { xp: 500, unlockTheme: 'unicorn' },
        },
    ];

    // Conquistas desbloqueadas pelo usuário (carregadas do backend)
    unlockedAchievements = signal<UserAchievement[]>([]);

    // Fila de conquistas recém-desbloqueadas (para mostrar modal)
    newlyUnlocked = signal<Achievement[]>([]);

    constructor() {
        console.log(`🏆 AchievementsService: ${this.ALL_ACHIEVEMENTS.length} conquistas disponíveis`);
    }

    /**
     * Retorna todas as conquistas disponíveis
     */
    getAllAchievements(): Achievement[] {
        return [...this.ALL_ACHIEVEMENTS];
    }

    /**
     * Retorna conquista por ID
     */
    getAchievementById(id: string): Achievement | undefined {
        return this.ALL_ACHIEVEMENTS.find(a => a.id === id);
    }

    /**
     * Verifica se conquista já foi desbloqueada
     */
    isUnlocked(achievementId: string): boolean {
        return this.unlockedAchievements().some(ua => ua.achievementId === achievementId);
    }

    /**
     * Desbloquear conquista
     */
    unlockAchievement(achievement: Achievement): void {
        // Não desbloquear se já foi desbloqueada
        if (this.isUnlocked(achievement.id)) {
            return;
        }

        const userAchievement: UserAchievement = {
            achievementId: achievement.id,
            unlockedAt: Date.now(),
            seen: false,
        };

        // Adicionar à lista de desbloqueadas
        this.unlockedAchievements.update(list => [...list, userAchievement]);

        // Adicionar à fila de novos (para modal)
        this.newlyUnlocked.update(list => [...list, achievement]);

        console.log(`🎉 Conquista desbloqueada: ${achievement.name} (+${achievement.reward?.xp || 0} XP)`);
    }

    /**
     * Marcar conquista como vista
     */
    markAsSeen(achievementId: string): void {
        this.unlockedAchievements.update(list =>
            list.map(ua =>
                ua.achievementId === achievementId ? { ...ua, seen: true } : ua
            )
        );
    }

    /**
     * Limpar fila de novas conquistas
     */
    clearNewlyUnlocked(): void {
        this.newlyUnlocked.set([]);
    }

    /**
     * Verificar condições de conquistas baseado em stats do usuário
     */
    checkAchievements(stats: {
        questionsAnswered: number;
        correctAnswers: number;
        currentStreak: number;
        level: number;
        consecutiveCorrect?: number;
        subjectStats?: { subject: string; answered: number; correct: number }[];
    }): Achievement[] {
        const newAchievements: Achievement[] = [];

        for (const achievement of this.ALL_ACHIEVEMENTS) {
            // Pular se já desbloqueada
            if (this.isUnlocked(achievement.id)) {
                continue;
            }

            // Verificar condição
            if (this.checkCondition(achievement.condition, stats)) {
                this.unlockAchievement(achievement);
                newAchievements.push(achievement);
            }
        }

        return newAchievements;
    }

    /**
     * Verificar se uma condição específica foi atendida
     */
    private checkCondition(
        condition: AchievementCondition,
        stats: {
            questionsAnswered: number;
            correctAnswers: number;
            currentStreak: number;
            level: number;
            consecutiveCorrect?: number;
            subjectStats?: { subject: string; answered: number; correct: number }[];
        }
    ): boolean {
        switch (condition.type) {
            case 'questions_answered':
                return stats.questionsAnswered >= condition.target;

            case 'streak':
                return stats.currentStreak >= condition.target;

            case 'level':
                return stats.level >= condition.target;

            case 'perfect_run':
                return (stats.consecutiveCorrect || 0) >= condition.target;

            case 'subject_mastery':
                if (!condition.subject || !stats.subjectStats) return false;
                const subjectStat = stats.subjectStats.find(
                    s => s.subject === condition.subject
                );
                if (!subjectStat) return false;

                // Precisa ter respondido target questões E ter 90%+ de acerto
                const accuracy = subjectStat.answered > 0
                    ? (subjectStat.correct / subjectStat.answered) * 100
                    : 0;

                return subjectStat.answered >= condition.target && accuracy >= 90;

            default:
                return false;
        }
    }

    /**
     * Carregar conquistas desbloqueadas do backend
     */
    loadUnlockedAchievements(achievements: UserAchievement[]): void {
        this.unlockedAchievements.set(achievements);
    }

    /**
     * Obter total de XP ganho com conquistas
     */
    getTotalAchievementXP(): number {
        return this.unlockedAchievements().reduce((total, ua) => {
            const achievement = this.getAchievementById(ua.achievementId);
            return total + (achievement?.reward?.xp || 0);
        }, 0);
    }

    /**
     * Obter progresso de uma conquista específica
     */
    getAchievementProgress(achievementId: string, stats: any): number {
        const achievement = this.getAchievementById(achievementId);
        if (!achievement) return 0;

        const condition = achievement.condition;

        switch (condition.type) {
            case 'questions_answered':
                return Math.min((stats.questionsAnswered / condition.target) * 100, 100);

            case 'streak':
                return Math.min((stats.currentStreak / condition.target) * 100, 100);

            case 'level':
                return Math.min((stats.level / condition.target) * 100, 100);

            case 'perfect_run':
                return Math.min(((stats.consecutiveCorrect || 0) / condition.target) * 100, 100);

            case 'subject_mastery':
                if (!condition.subject || !stats.subjectStats) return 0;
                const subjectStat = stats.subjectStats.find(
                    (s: any) => s.subject === condition.subject
                );
                return subjectStat
                    ? Math.min((subjectStat.answered / condition.target) * 100, 100)
                    : 0;

            default:
                return 0;
        }
    }
}
