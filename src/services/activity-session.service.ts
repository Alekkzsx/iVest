import { Injectable, signal } from '@angular/core';
import type {
    ActivitySession,
    ActivityType,
    ActivityStatus,
    QuestionDifficulty,
} from '../types/gamification.types';
import { calculateCompletionBonus } from '../types/gamification.types';

@Injectable({
    providedIn: 'root',
})
export class ActivitySessionService {
    // Sessão ativa atual
    currentSession = signal<ActivitySession | null>(null);

    // Histórico de sessões completadas (últimas 50)
    completedSessions = signal<ActivitySession[]>([]);

    constructor() {
        console.log('🎮 ActivitySessionService initialized');
    }

    /**
     * Iniciar nova sessão de atividade
     */
    startSession(type: ActivityType): string {
        // Se já existe sessão ativa, marcar como abandonada
        if (this.currentSession()) {
            this.abandonSession();
        }

        const session: ActivitySession = {
            id: crypto.randomUUID(),
            type,
            startedAt: Date.now(),
            status: 'in_progress',
            questionsCount: 0,
            questionsDifficulty: {
                easy: 0,
                medium: 0,
                hard: 0,
            },
            earnedXP: 0,
        };

        this.currentSession.set(session);
        console.log(`▶️ Sessão iniciada: ${type} [${session.id}]`);

        return session.id;
    }

    /**
     * Registrar questão respondida na sessão atual
     */
    recordQuestion(difficulty: 'Fácil' | 'Médio' | 'Difícil'): void {
        const session = this.currentSession();
        if (!session) {
            console.warn('⚠️ Tentativa de registrar questão sem sessão ativa');
            return;
        }

        // Atualizar contadores
        const updated: ActivitySession = {
            ...session,
            questionsCount: session.questionsCount + 1,
            questionsDifficulty: {
                ...session.questionsDifficulty,
                easy: session.questionsDifficulty.easy + (difficulty === 'Fácil' ? 1 : 0),
                medium: session.questionsDifficulty.medium + (difficulty === 'Médio' ? 1 : 0),
                hard: session.questionsDifficulty.hard + (difficulty === 'Difícil' ? 1 : 0),
            },
        };

        this.currentSession.set(updated);
    }

    /**
     * Completar sessão atual (usuário terminou a atividade)
     */
    completeSession(): number {
        const session = this.currentSession();
        if (!session) {
            console.warn('⚠️ Tentativa de completar sessão inexistente');
            return 0;
        }

        // Calcular XP de bônus
        const bonusXP = calculateCompletionBonus(
            session.type,
            session.questionsDifficulty
        );

        const completed: ActivitySession = {
            ...session,
            status: 'completed',
            completedAt: Date.now(),
            earnedXP: bonusXP,
        };

        // Adicionar ao histórico
        this.completedSessions.update(sessions => {
            const updated = [completed, ...sessions];
            // Manter apenas últimas 50
            return updated.slice(0, 50);
        });

        // Limpar sessão atual
        this.currentSession.set(null);

        console.log(
            `✅ Sessão completada: ${session.type} | ` +
            `${session.questionsCount} questões | +${bonusXP} XP`
        );

        return bonusXP;
    }

    /**
     * Abandonar sessão atual (usuário saiu antes de terminar)
     */
    abandonSession(): void {
        const session = this.currentSession();
        if (!session) return;

        const abandoned: ActivitySession = {
            ...session,
            status: 'abandoned',
            completedAt: Date.now(),
            earnedXP: 0, // SEM XP de bônus!
        };

        // NÃO adicionar ao histórico de completadas
        // Apenas salvar em histórico geral se necessário

        this.currentSession.set(null);

        console.log(
            `❌ Sessão abandonada: ${session.type} | ` +
            `${session.questionsCount} questões | +0 XP (sem bônus)`
        );
    }

    /**
     * Verificar se existe sessão ativa
     */
    hasActiveSession(): boolean {
        return this.currentSession() !== null;
    }

    /**
     * Obter sessão ativa
     */
    getActiveSession(): ActivitySession | null {
        return this.currentSession();
    }

    /**
     * Obter estatísticas de sessões completadas
     */
    getStats(): {
        totalCompleted: number;
        totalXPEarned: number;
        byType: Record<ActivityType, number>;
    } {
        const completed = this.completedSessions();

        return {
            totalCompleted: completed.length,
            totalXPEarned: completed.reduce((sum, s) => sum + s.earnedXP, 0),
            byType: {
                quiz: completed.filter(s => s.type === 'quiz').length,
                interpretation: completed.filter(s => s.type === 'interpretation').length,
                resolution: completed.filter(s => s.type === 'resolution').length,
            },
        };
    }

    /**
     * Carregar sessões completadas do backend
     */
    loadCompletedSessions(sessions: ActivitySession[]): void {
        this.completedSessions.set(sessions.slice(0, 50));
    }

    /**
     * Limpar sessão ativa (emergência)
     */
    clearActiveSession(): void {
        this.currentSession.set(null);
    }
}
