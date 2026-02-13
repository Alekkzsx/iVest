/**
 * Gamification Types and Interfaces
 * Sistema completo de gamificação para VestBot
 */

// ============================================================================
// ACHIEVEMENTS (Conquistas)
// ============================================================================

export type AchievementConditionType =
    | 'questions_answered'
    | 'streak'
    | 'accuracy'
    | 'level'
    | 'perfect_run'
    | 'subject_mastery'
    | 'quiz_completed';

export interface AchievementCondition {
    type: AchievementConditionType;
    target: number;
    subject?: string;
    consecutiveCorrect?: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: AchievementCondition;
    reward?: {
        xp?: number;
        unlockTheme?: string;
    };
}

export interface UserAchievement {
    achievementId: string;
    unlockedAt: number;
    seen: boolean;
    progress?: number; // Para mostrar progresso parcial
}

// ============================================================================
// CHALLENGES (Desafios)
// ============================================================================

export type ChallengeType = 'daily' | 'weekly';

export type ChallengeConditionType =
    | 'answer_questions'
    | 'streak'
    | 'subject_study'
    | 'perfect_streak'
    | 'complete_quizzes'
    | 'accuracy_target';

export interface ChallengeCondition {
    type: ChallengeConditionType;
    target: number;
    subject?: string;
}

export interface Challenge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji icon for visual representation
    type: ChallengeType;
    condition: ChallengeCondition;
    reward: {
        xp: number;
    };
    expiresAt: number;
}

export interface UserChallenge {
    challengeId: string;
    progress: number;
    completed: boolean;
    completedAt?: number;
    claimed: boolean;
}

// ============================================================================
// ACTIVITY SESSION (Sessões de Atividade para XP por conclusão)
// ============================================================================

export type ActivityType = 'quiz' | 'interpretation' | 'resolution';
export type ActivityStatus = 'in_progress' | 'completed' | 'abandoned';

export interface QuestionDifficulty {
    easy: number;
    medium: number;
    hard: number;
}

export interface ActivitySession {
    id: string;
    type: ActivityType;
    startedAt: number;
    completedAt?: number;
    status: ActivityStatus;
    questionsCount: number;
    questionsDifficulty: QuestionDifficulty;
    earnedXP: number;
}

// ============================================================================
// LEVEL SYSTEM (Sistema de Níveis)
// ============================================================================

export interface LevelInfo {
    level: number;
    title: string;
    minXP: number;
    maxXP: number;
    rewards?: LevelReward[];
}

export interface LevelReward {
    type: 'theme' | 'feature' | 'badge';
    id: string;
    name: string;
}

// ============================================================================
// GAMIFICATION DATA (Estrutura completa de dados de gamificação)
// ============================================================================

export interface GamificationData {
    achievements: UserAchievement[];
    challenges: UserChallenge[];
    activeSessions: ActivitySession[];
    completedSessions: ActivitySession[];
    unlockedThemes: string[];
    unlockedFeatures: string[];
}

// ============================================================================
// XP CALCULATION
// ============================================================================

export const XP_CONFIG = {
    // XP por questão
    CORRECT_ANSWER: 50,
    WRONG_ANSWER: 10,

    // XP por conclusão de atividade (base)
    QUIZ_COMPLETION: 100,
    INTERPRETATION_COMPLETION: 50,
    RESOLUTION_COMPLETION: 20,

    // Multiplicadores de dificuldade
    DIFFICULTY_MULTIPLIERS: {
        'Fácil': 1.0,
        'Médio': 1.5,
        'Difícil': 2.0,
    } as const,

    // XP por nível
    XP_PER_LEVEL: 1000,
};

// ============================================================================
// LEVEL TITLES
// ============================================================================

export const LEVEL_TITLES: Record<number, string> = {
    1: 'Iniciante',
    11: 'Aprendiz',
    21: 'Estudante',
    31: 'Avançado',
    41: 'Expert',
    51: 'Mestre ETEC',
};

export function getLevelTitle(level: number): string {
    // Encontra o título mais próximo menor ou igual ao nível
    const keys = Object.keys(LEVEL_TITLES)
        .map(Number)
        .sort((a, b) => b - a);

    for (const key of keys) {
        if (level >= key) {
            return LEVEL_TITLES[key];
        }
    }

    return LEVEL_TITLES[1];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcula XP de bônus por completar uma atividade
 */
export function calculateCompletionBonus(
    activityType: ActivityType,
    difficulties: QuestionDifficulty
): number {
    const { easy, medium, hard } = difficulties;
    const multipliers = XP_CONFIG.DIFFICULTY_MULTIPLIERS;

    // XP das questões baseado em dificuldade
    const questionXP =
        easy * multipliers['Fácil'] +
        medium * multipliers['Médio'] +
        hard * multipliers['Difícil'];

    // XP base da atividade
    let baseXP = 0;
    switch (activityType) {
        case 'quiz':
            baseXP = XP_CONFIG.QUIZ_COMPLETION;
            break;
        case 'interpretation':
            baseXP = XP_CONFIG.INTERPRETATION_COMPLETION;
            break;
        case 'resolution':
            baseXP = XP_CONFIG.RESOLUTION_COMPLETION;
            break;
    }

    return Math.floor(questionXP * 10 + baseXP);
}
