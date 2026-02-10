import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResolutionsService, ResolutionMode, ResolutionFilter, QuestionResolution } from '../../services/resolutions.service';
import { Question } from '../../services/content.service';
import { LatexPipe } from '../../pipes/latex.pipe';

type ViewState = 'selection' | 'list' | 'viewer' | 'empty';

@Component({
    selector: 'app-resolutions',
    standalone: true,
    imports: [CommonModule, LatexPipe],
    templateUrl: './resolutions.component.html',
    styleUrl: './resolutions.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResolutionsComponent {
    private resolutionsService = inject(ResolutionsService);

    // View state
    viewState = signal<ViewState>('selection');

    // Selection
    selectedMode = signal<ResolutionMode | null>(null);
    selectedFilter = signal<ResolutionFilter | null>(null);

    // Data
    filteredQuestions = signal<Question[]>([]);
    currentQuestion = signal<Question | null>(null);
    currentResolution = signal<QuestionResolution | null>(null);

    // Viewer state
    visibleStepsCount = signal(0);
    showCorrectAnswer = signal(false);

    /**
     * Select the mode (Quiz vs Interpretation)
     */
    selectMode(mode: ResolutionMode) {
        this.selectedMode.set(mode);
    }

    /**
     * Select a filter and fetch questions
     */
    async selectFilter(filter: ResolutionFilter) {
        const mode = this.selectedMode();
        if (!mode) return;

        this.selectedFilter.set(filter);
        const questions = await this.resolutionsService.getFilteredQuestions(mode, filter);

        if (questions.length === 0) {
            this.viewState.set('empty');
        } else {
            this.filteredQuestions.set(questions);
            this.viewState.set('list');
        }
    }

    /**
     * Open a specific question to view resolution
     */
    async openResolution(question: Question) {
        const mode = this.selectedMode();
        if (!mode) return;

        await this.resolutionsService.loadResolutions();
        const resolution = this.resolutionsService.getResolutionForQuestion(question.id, mode);

        this.currentQuestion.set(question);
        this.currentResolution.set(resolution);
        this.visibleStepsCount.set(0);
        this.showCorrectAnswer.set(false);
        this.viewState.set('viewer');

        this.resolutionsService.markResolutionAsViewed(question.id);
    }

    /**
     * Logic to reveal one more step
     */
    revealNextStep() {
        const res = this.currentResolution();
        if (!res) return;

        if (this.visibleStepsCount() < res.steps.length) {
            this.visibleStepsCount.update(n => n + 1);
        } else {
            this.showCorrectAnswer.set(true);
        }
    }

    /**
     * Navigation
     */
    goBack() {
        if (this.viewState() === 'viewer') {
            this.viewState.set('list');
        } else if (this.viewState() === 'list' || this.viewState() === 'empty') {
            this.viewState.set('selection');
            this.selectedFilter.set(null);
        } else {
            this.selectedMode.set(null);
        }
    }

    getOptionLetter(index: number): string {
        return String.fromCharCode(65 + index);
    }
}
