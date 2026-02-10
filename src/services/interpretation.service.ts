import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Question, ContentService } from './content.service';
import { UserDataService } from './user-data.service';

/**
 * Representa um grupo de questões de interpretação
 */
export interface InterpretationGroup {
    groupId: number;
    theme: string;
    supportText: string;
    questions: Question[];
}

/**
 * Progresso do usuário no módulo de interpretação
 */
export interface InterpretationProgress {
    currentGroupIndex: number;
    answeredQuestions: Map<number, number>;
    correctAnswers: number;
    totalQuestions: number;
}

/**
 * Service dedicado para gerenciar questões de interpretação de texto
 * Separado do sistema de simulados
 */
@Injectable({
    providedIn: 'root'
})
export class InterpretationService {
    private http = inject(HttpClient);

    // State
    private groups = signal<InterpretationGroup[]>([]);
    private currentIndex = signal(0);
    private answeredQuestions = signal<Map<number, number>>(new Map());
    private isLoaded = signal(false);

    // Computed
    currentGroup = computed(() => this.groups()[this.currentIndex()]);
    totalGroups = computed(() => this.groups().length);

    /**
     * Carrega questões de interpretação do arquivo Interpretação.txt
     */
    async loadInterpretations(): Promise<void> {
        if (this.isLoaded()) {
            console.log('Interpretations already loaded');
            return;
        }

        try {
            console.log('🔄 Loading interpretation questions...');

            // Carregar arquivo JSON
            const response = await firstValueFrom(
                this.http.get<any[]>('/questions/Interpretação.txt')
            );

            console.log(`✓ Loaded ${response.length} interpretation questions`);

            // Agrupar questões por grupo_id
            const grouped = this.groupQuestions(response);

            console.log(`✓ Created ${grouped.length} interpretation groups`);

            this.groups.set(grouped);
            this.isLoaded.set(true);
        } catch (error) {
            console.error('✗ Error loading interpretation questions:', error);
            throw error;
        }
    }

    /**
     * Agrupa questões pelo campo grupo_id
     */
    private groupQuestions(rawQuestions: any[]): InterpretationGroup[] {
        // Criar mapa de grupos
        const groupMap = new Map<number, any[]>();

        rawQuestions.forEach(q => {
            const groupId = q.grupo_id;
            if (!groupMap.has(groupId)) {
                groupMap.set(groupId, []);
            }
            groupMap.get(groupId)!.push(q);
        });

        // Converter para InterpretationGroup[], ordenado por groupId
        return Array.from(groupMap.entries())
            .sort((a, b) => a[0] - b[0]) // Ordenar por grupo_id
            .map(([groupId, questions]) => {
                // Ordenar questões dentro do grupo por id
                const sortedQuestions = questions.sort((a, b) => a.id - b.id);

                return {
                    groupId,
                    theme: sortedQuestions[0].tema,
                    supportText: sortedQuestions[0].texto_referencia,
                    questions: sortedQuestions.map(q => this.convertQuestion(q))
                };
            });
    }

    /**
     * Converte questão do formato do arquivo para o formato interno
     */
    private convertQuestion(q: any): Question {
        // Mapa de dificuldade
        const difficultyMap: { [key: string]: 'Fácil' | 'Médio' | 'Difícil' } = {
            'Fácil': 'Fácil',
            'Facil': 'Fácil',
            'Média': 'Médio',
            'Media': 'Médio',
            'Médio': 'Médio',
            'Medio': 'Médio',
            'Difícil': 'Difícil',
            'Dificil': 'Difícil'
        };

        const difficulty = difficultyMap[q.dificuldade] || 'Médio';

        // Encontrar índice da resposta correta
        const correctIndex = q.alternativas.findIndex((alt: string) =>
            alt.trim().toLowerCase() === q.correta.trim().toLowerCase()
        );

        return {
            id: q.id,
            subject: q.materia,
            text: q.enunciado,
            options: q.alternativas,
            correctIndex: correctIndex !== -1 ? correctIndex : 0,
            explanation: q.explicacao_base,
            difficulty: difficulty,
            supportText: q.texto_referencia,
            groupId: q.grupo_id,
            theme: q.tema
        };
    }

    /**
     * Obtém todos os grupos de interpretação
     */
    getGroups(): InterpretationGroup[] {
        return this.groups();
    }

    /**
     * Obtém o grupo atual
     */
    getCurrentGroup(): InterpretationGroup | undefined {
        return this.currentGroup();
    }

    /**
     * Obtém o índice do grupo atual
     */
    getCurrentIndex(): number {
        return this.currentIndex();
    }

    /**
     * Avança para o próximo grupo
     */
    nextGroup(): boolean {
        if (this.currentIndex() < this.groups().length - 1) {
            this.currentIndex.update(i => i + 1);
            return true;
        }
        return false;
    }

    /**
     * Volta para o grupo anterior
     */
    previousGroup(): boolean {
        if (this.currentIndex() > 0) {
            this.currentIndex.update(i => i - 1);
            return true;
        }
        return false;
    }

    /**
     * Vai para um grupo específico
     */
    goToGroup(index: number): boolean {
        if (index >= 0 && index < this.groups().length) {
            this.currentIndex.set(index);
            return true;
        }
        return false;
    }

    private userDataService = inject(UserDataService);

    /**
     * Registra a resposta do usuário para uma questão e salva no histórico dedicado
     */
    async recordInterpretationAttempt(questionId: number, wasCorrect: boolean): Promise<void> {
        const fullData = await this.userDataService.loadUserData();
        const history = fullData.user.interpretationHistory || [];

        const attempt = {
            questionId,
            timestamp: Date.now(),
            wasCorrect
        };

        const filtered = history.filter(h => h.questionId !== questionId);
        filtered.push(attempt);

        this.userDataService.saveUserInterpretationHistory(filtered);
    }

    /**
     * Registra a resposta do usuário para uma questão (Sessão local)
     */
    submitAnswer(questionId: number, answerIndex: number): void {
        this.answeredQuestions.update(map => {
            const newMap = new Map(map);
            newMap.set(questionId, answerIndex);
            return newMap;
        });
    }

    /**
     * Obtém a resposta do usuário para uma questão
     */
    getAnswer(questionId: number): number | undefined {
        return this.answeredQuestions().get(questionId);
    }

    /**
     * Limpa respostas do grupo atual
     */
    clearCurrentGroupAnswers(): void {
        const currentGroup = this.getCurrentGroup();
        if (currentGroup) {
            this.answeredQuestions.update(map => {
                const newMap = new Map(map);
                currentGroup.questions.forEach(q => newMap.delete(q.id));
                return newMap;
            });
        }
    }

    /**
     * Verifica se todas as questões do grupo atual foram respondidas
     */
    isCurrentGroupComplete(): boolean {
        const currentGroup = this.getCurrentGroup();
        if (!currentGroup) return false;

        return currentGroup.questions.every(q =>
            this.answeredQuestions().has(q.id)
        );
    }

    /**
     * Calcula o número de acertos no grupo atual
     */
    getCurrentGroupScore(): { correct: number; total: number } {
        const currentGroup = this.getCurrentGroup();
        if (!currentGroup) return { correct: 0, total: 0 };

        let correct = 0;
        currentGroup.questions.forEach(q => {
            const userAnswer = this.answeredQuestions().get(q.id);
            if (userAnswer === q.correctIndex) {
                correct++;
            }
        });

        return {
            correct,
            total: currentGroup.questions.length
        };
    }

    /**
     * Reseta o progresso completo
     */
    resetProgress(): void {
        this.currentIndex.set(0);
        this.answeredQuestions.set(new Map());
    }

    /**
     * Obtém o progresso geral
     */
    getProgress(): InterpretationProgress {
        let correctAnswers = 0;
        let totalQuestions = 0;

        this.groups().forEach(group => {
            group.questions.forEach(q => {
                totalQuestions++;
                const userAnswer = this.answeredQuestions().get(q.id);
                if (userAnswer === q.correctIndex) {
                    correctAnswers++;
                }
            });
        });

        return {
            currentGroupIndex: this.currentIndex(),
            answeredQuestions: this.answeredQuestions(),
            correctAnswers,
            totalQuestions
        };
    }
}
