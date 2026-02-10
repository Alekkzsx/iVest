import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ContentService, Question } from './content.service';
import { UserDataService } from './user-data.service';
import { InterpretationService } from './interpretation.service';

export interface ResolutionStep {
    title: string;
    content: string;
}

export interface QuestionResolution {
    questionId: number;
    steps: ResolutionStep[];
}

export type ResolutionMode = 'quiz' | 'interpretation';
export type ResolutionFilter = 'wrong' | 'correct' | 'new' | 'random';

@Injectable({
    providedIn: 'root'
})
export class ResolutionsService {
    private http = inject(HttpClient);
    private contentService = inject(ContentService);
    private userDataService = inject(UserDataService);
    private interpretationService = inject(InterpretationService);

    // State
    private quizResolutions = signal<QuestionResolution[]>([]);
    private interpretationResolutions = signal<QuestionResolution[]>([]);
    private isLoaded = signal(false);

    /**
     * Load resolution data files
     */
    async loadResolutions(): Promise<void> {
        if (this.isLoaded()) return;

        try {
            // In a real scenario, these files would exist. 
            // We'll try to load them, or use empty arrays if they don't exist yet.
            const quizRes = await firstValueFrom(this.http.get<QuestionResolution[]>('/questions/Resolução-Simulados.json')).catch(() => []);
            const intRes = await firstValueFrom(this.http.get<QuestionResolution[]>('/questions/Resolução-Interpretação.json')).catch(() => []);

            this.quizResolutions.set(quizRes);
            this.interpretationResolutions.set(intRes);
            this.isLoaded.set(true);
        } catch (error) {
            console.error('Error loading Resolutions:', error);
        }
    }

    /**
     * Filter questions based on mode and user history
     */
    async getFilteredQuestions(mode: ResolutionMode, filter: ResolutionFilter): Promise<Question[]> {
        const userData = await this.userDataService.loadUserData();
        let allQuestions: Question[] = [];

        if (mode === 'quiz') {
            // Need to ensure questions are loaded in ContentService
            await this.contentService.loadQuestionsFromFiles();
            allQuestions = this.contentService.getQuestions();
        } else {
            await this.interpretationService.loadInterpretations();
            allQuestions = this.interpretationService.getGroups().flatMap(g => g.questions);
        }

        const history = mode === 'quiz'
            ? userData.user.questionHistory
            : userData.user.interpretationHistory;

        switch (filter) {
            case 'wrong':
                const wrongIds = history.filter(h => !h.wasCorrect).map(h => h.questionId);
                return allQuestions.filter(q => wrongIds.includes(q.id));

            case 'correct':
                const correctIds = history.filter(h => h.wasCorrect).map(h => h.questionId);
                return allQuestions.filter(q => correctIds.includes(q.id));

            case 'new':
                const seenIds = history.map(h => h.questionId);
                return allQuestions.filter(q => !seenIds.includes(q.id));

            case 'random':
            default:
                return [...allQuestions].sort(() => Math.random() - 0.5);
        }
    }

    /**
     * Get resolution steps for a specific question
     */
    getResolutionForQuestion(questionId: number, mode: ResolutionMode): QuestionResolution | null {
        const source = mode === 'quiz' ? this.quizResolutions() : this.interpretationResolutions();
        return source.find(r => r.questionId === questionId) || null;
    }

    /**
     * Record that a user viewed a resolution
     */
    markResolutionAsViewed(questionId: number): void {
        const data = this.userDataService.getUserData();
        if (!data) return;

        const history = data.user.resolutionsHistory || [];
        const exists = history.find(h => h.questionId === questionId);

        if (!exists) {
            const newHistory = [...history, {
                questionId,
                timestamp: Date.now(),
                viewedAt: Date.now()
            }];
            this.userDataService.saveUserResolutionsHistory(newHistory);
        }
    }
}
