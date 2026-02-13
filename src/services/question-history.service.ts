import { Injectable, inject } from '@angular/core';
import { UserDataService } from './user-data.service';

/**
 * Context where the question was attempted
 */
export type QuestionContext = 'quiz' | 'interpretation' | 'resolution';

/**
 * Represents a single attempt at answering a question
 */
export interface QuestionAttempt {
    questionId: number;
    timestamp: number;      // Unix timestamp in milliseconds
    wasCorrect: boolean;
    context?: QuestionContext; // Optional for backwards compatibility
}

/**
 * Service to manage question history and spaced repetition logic
 * 
 * Rules:
 * - Quiz/Interpretation CORRECT: blocked for 3 hours
 * - Quiz/Interpretation INCORRECT: blocked for 30 minutes
 * - Resolution (viewed): REDUCES block time to 30min (if was correct) or 10min (if was incorrect)
 */
@Injectable({
    providedIn: 'root'
})
export class QuestionHistoryService {
    private userDataService = inject(UserDataService);

    // Time intervals in milliseconds
    private readonly QUIZ_CORRECT_BLOCK_TIME = 3 * 60 * 60 * 1000;  // 3 hours
    private readonly QUIZ_INCORRECT_BLOCK_TIME = 30 * 60 * 1000;    // 30 minutes
    private readonly RESOLUTION_CORRECT_REDUCTION = 30 * 60 * 1000;  // 30 minutes (reduced from 3h)
    private readonly RESOLUTION_INCORRECT_REDUCTION = 10 * 60 * 1000; // 10 minutes (reduced from 30min)

    constructor() {
        this.cleanupOldEntries();
    }

    /**
     * Record a question attempt
     * 
     * @param questionId - ID of the question
     * @param wasCorrect - Whether the answer was correct
     * @param context - Context where the question was attempted ('quiz', 'interpretation', or 'resolution')
     */
    recordAttempt(questionId: number, wasCorrect: boolean, context: QuestionContext = 'quiz'): void {
        const history = this.getHistory();

        // Check if there's a previous attempt for this question
        const previousAttempt = history.find(h => h.questionId === questionId);

        const attempt: QuestionAttempt = {
            questionId,
            timestamp: Date.now(),
            wasCorrect,
            context
        };

        // Special logic for 'resolution' context: it reduces block time
        if (context === 'resolution' && previousAttempt) {
            // Resolution inherits the previous correctness status
            // but updates timestamp to "reset" with reduced time
            attempt.wasCorrect = previousAttempt.wasCorrect;
            console.log(`🔄 Resolution viewed for question ${questionId} (was ${previousAttempt.wasCorrect ? 'correct' : 'incorrect'}). Reducing block time.`);
        }

        // Remove previous attempts for this question
        const filtered = history.filter(h => h.questionId !== questionId);

        // Add new attempt
        filtered.push(attempt);

        // Save via UserDataService
        this.saveHistory(filtered);

        const contextLabel = context === 'quiz' ? 'quiz' : context === 'interpretation' ? 'interpretation' : 'resolution';
        console.log(`📝 Recorded ${wasCorrect ? 'correct' : 'incorrect'} attempt for question ${questionId} [${contextLabel}]`);
    }

    /**
     * Check if a question can be shown to the user
     */
    canShowQuestion(questionId: number): boolean {
        const history = this.getHistory();
        const lastAttempt = history.find(h => h.questionId === questionId);

        // If never attempted, always show
        if (!lastAttempt) {
            return true;
        }

        const now = Date.now();
        const timeSinceAttempt = now - lastAttempt.timestamp;

        // Determine block time based on context and correctness
        let blockTime: number;
        const context = lastAttempt.context || 'quiz'; // Default to 'quiz' for backwards compatibility

        if (context === 'resolution') {
            // Resolution context uses reduced times
            blockTime = lastAttempt.wasCorrect
                ? this.RESOLUTION_CORRECT_REDUCTION
                : this.RESOLUTION_INCORRECT_REDUCTION;
        } else {
            // Quiz/Interpretation context uses normal times
            blockTime = lastAttempt.wasCorrect
                ? this.QUIZ_CORRECT_BLOCK_TIME
                : this.QUIZ_INCORRECT_BLOCK_TIME;
        }

        return timeSinceAttempt >= blockTime;
    }

    /**
     * Get the block status for a question
     * Returns null if question is available, or remaining time in ms if blocked
     */
    getBlockedTimeRemaining(questionId: number): number | null {
        const history = this.getHistory();
        const lastAttempt = history.find(h => h.questionId === questionId);

        if (!lastAttempt) {
            return null;
        }

        const now = Date.now();
        const timeSinceAttempt = now - lastAttempt.timestamp;

        // Determine block time based on context and correctness
        const context = lastAttempt.context || 'quiz'; // Default to 'quiz' for backwards compatibility

        let blockTime: number;
        if (context === 'resolution') {
            blockTime = lastAttempt.wasCorrect
                ? this.RESOLUTION_CORRECT_REDUCTION
                : this.RESOLUTION_INCORRECT_REDUCTION;
        } else {
            blockTime = lastAttempt.wasCorrect
                ? this.QUIZ_CORRECT_BLOCK_TIME
                : this.QUIZ_INCORRECT_BLOCK_TIME;
        }

        const remaining = blockTime - timeSinceAttempt;
        return remaining > 0 ? remaining : null;
    }

    /**
     * Get all attempts for a specific question
     */
    getQuestionHistory(questionId: number): QuestionAttempt | undefined {
        const history = this.getHistory();
        return history.find(h => h.questionId === questionId);
    }

    /**
     * Get statistics about the question history
     */
    getStatistics() {
        const history = this.getHistory();
        const correct = history.filter(h => h.wasCorrect).length;
        const incorrect = history.filter(h => !h.wasCorrect).length;

        return {
            totalAttempts: history.length,
            correctAnswers: correct,
            incorrectAnswers: incorrect,
            accuracy: history.length > 0 ? (correct / history.length) * 100 : 0
        };
    }

    /**
     * Clear all history
     */
    clearHistory(): void {
        this.saveHistory([]);
        console.log('🗑️ Question history cleared');
    }

    /**
     * Get all history from Unified User Data
     */
    private getHistory(): QuestionAttempt[] {
        const userData = this.userDataService.getUserData();
        if (userData && userData.user.questionHistory) {
            return userData.user.questionHistory;
        }
        return [];
    }

    /**
     * Save history to Unified User Data (V4: Specific Endpoint)
     */
    private saveHistory(history: QuestionAttempt[]): void {
        // Update via the dedicated history endpoint for granular saving
        this.userDataService.saveUserHistory(history);
    }

    /**
     * Clean up old entries that are past the block time
     */
    private cleanupOldEntries(): void {
        // Run cleanup only if data is loaded
        const userData = this.userDataService.getUserData();
        if (!userData) return;

        const history = this.getHistory();
        const now = Date.now();

        // Keep only entries that are still within block time
        const filtered = history.filter(h => {
            const age = now - h.timestamp;
            const context = h.context || 'quiz';

            // Determine block time based on context
            let blockTime: number;
            if (context === 'resolution') {
                blockTime = h.wasCorrect
                    ? this.RESOLUTION_CORRECT_REDUCTION
                    : this.RESOLUTION_INCORRECT_REDUCTION;
            } else {
                blockTime = h.wasCorrect
                    ? this.QUIZ_CORRECT_BLOCK_TIME
                    : this.QUIZ_INCORRECT_BLOCK_TIME;
            }

            return age < blockTime * 2; // Keep for 2x block time for historical data
        });

        if (filtered.length < history.length) {
            this.saveHistory(filtered);
            console.log(`🧹 Cleaned up ${history.length - filtered.length} old history entries`);
        }
    }

    /**
     * Get formatted time remaining for a blocked question
     */
    getFormattedBlockTime(questionId: number): string | null {
        const remaining = this.getBlockedTimeRemaining(questionId);

        if (!remaining) {
            return null;
        }

        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days} dia${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
    }
}
