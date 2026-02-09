import { Component, inject, signal, OnDestroy, computed, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService, Question } from '../../services/content.service';
import { QuestionHistoryService } from '../../services/question-history.service';
import { DictionaryService, DictionaryEntry } from '../../services/dictionary.service';
import { WordPopupComponent } from '../word-popup/word-popup.component';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, WordPopupComponent],
  templateUrl: './quiz.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuizComponent implements OnDestroy {
  contentService = inject(ContentService);
  questionHistory = inject(QuestionHistoryService);
  dictionary = inject(DictionaryService);

  // Configuration State
  availableSubjects = this.contentService.getSubjects();
  config = signal({
    selectedSubjects: [] as string[],
    questionCount: 50, // ETEC Standard
    difficulty: 'Mista' as 'Fácil' | 'Médio' | 'Difícil' | 'Mista',
    timerMinutes: 240 // ETEC Standard (4 hours)
  });

  // Quiz State
  quizActive = signal(false);
  questions = signal<Question[]>([]);
  currentIndex = signal(0);
  selectedOptionIndex = signal<number | null>(null);
  isAnswered = signal(false);
  isCorrect = signal(false);
  score = signal(0);
  quizFinished = signal(false);

  // Loading State
  isPreparing = signal(false);
  loadingMessage = signal('Organizando questões...');

  // Timer State
  timeLeft = signal(0); // in seconds
  private timerInterval: any;

  // Explanation State
  explanationText = signal<string | null>(null);

  // File Selection
  selectedFiles = signal<string[]>([]);
  availableFiles = this.contentService.getAvailableFiles();

  // Word Popup State
  showWordPopup = signal(false);
  selectedWord = signal('');
  wordDefinitions = signal<DictionaryEntry[] | null>(null);
  popupPosition = signal({ x: 0, y: 0 });

  constructor() {
    this.config.update(c => ({ ...c, selectedSubjects: [...this.availableSubjects] }));

    // Load all questions from local files on initialization
    this.loadLocalQuestions();
  }

  async loadLocalQuestions() {
    try {
      // Load all question files by default via HTTP
      await this.contentService.loadQuestionsFromFiles();
      const stats = this.contentService.getQuestions().length;
      console.log(`QuizComponent: ${stats} questions available for quizzes`);
    } catch (error) {
      console.error('Failed to load questions from files, using fallback:', error);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // --- Configuration Methods ---

  toggleSubject(subject: string) {
    this.config.update(c => {
      const exists = c.selectedSubjects.includes(subject);
      let newSubjects;
      if (exists) {
        newSubjects = c.selectedSubjects.filter(s => s !== subject);
      } else {
        newSubjects = [...c.selectedSubjects, subject];
      }
      return { ...c, selectedSubjects: newSubjects };
    });
  }

  setQuestionCount(count: number) {
    this.config.update(c => ({ ...c, questionCount: count }));
  }

  setDifficulty(diff: 'Fácil' | 'Médio' | 'Difícil' | 'Mista') {
    this.config.update(c => ({ ...c, difficulty: diff }));
  }

  setTimer(minutes: number) {
    this.config.update(c => ({ ...c, timerMinutes: minutes }));
  }

  setStandardSubjects() {
    this.config.update(c => ({ ...c, selectedSubjects: [...this.availableSubjects] }));
  }

  /**
   * Fisher-Yates Shuffle Algorithm - Estatisticamente uniforme
   * Garante que todas as permutações tenham a mesma probabilidade
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Distribui questões de forma balanceada entre matérias
   * Garante representação proporcional de todas as matérias selecionadas
   */
  private distributeBalanced(
    pool: Question[],
    targetCount: number,
    selectedSubjects: string[],
    difficultyFilter?: 'Fácil' | 'Médio' | 'Difícil'
  ): Question[] {
    // Aplicar filtro de dificuldade se fornecido
    let filteredPool = difficultyFilter
      ? pool.filter(q => q.difficulty === difficultyFilter)
      : pool;

    if (filteredPool.length === 0) return [];

    const finalSelection: Question[] = [];
    const usedIds = new Set<number>();

    // Cálculo de cotas
    const baseQuota = Math.floor(targetCount / selectedSubjects.length);
    const extraSlots = targetCount % selectedSubjects.length;

    // Embaralhar matérias para distribuição justa das sobras
    const shuffledSubjects = this.shuffleArray([...selectedSubjects]);

    // Fase 1: Distribuir cota base para cada matéria
    for (const subject of shuffledSubjects) {
      // FILTRO INTELIGENTE: aceita matérias exatas e compostas
      const subjectPool = filteredPool.filter(q => {
        const matchesSubject = q.subject === subject ||
          q.subject.includes(subject + ' /') ||  // "Matéria / Outra"
          q.subject.includes('/ ' + subject);    // "Outra / Matéria"
        return matchesSubject && !usedIds.has(q.id);
      });

      if (subjectPool.length === 0) continue;

      const shuffled = this.shuffleArray(subjectPool);
      const toTake = Math.min(baseQuota, shuffled.length);

      for (let i = 0; i < toTake; i++) {
        finalSelection.push(shuffled[i]);
        usedIds.add(shuffled[i].id);
      }
    }

    // Fase 2: Distribuir sobras priorizando matérias com menos questões
    if (finalSelection.length < targetCount && extraSlots > 0) {
      // Contar questões por matéria
      const subjectCounts = new Map<string, number>();
      shuffledSubjects.forEach(s => {
        subjectCounts.set(s, finalSelection.filter(q => q.subject === s).length);
      });

      // Ordenar matérias: menos questões primeiro
      const sortedSubjects = [...shuffledSubjects].sort((a, b) =>
        (subjectCounts.get(a) || 0) - (subjectCounts.get(b) || 0)
      );

      // Adicionar uma questão para cada matéria com menos representação
      for (const subject of sortedSubjects) {
        if (finalSelection.length >= targetCount) break;

        const available = filteredPool.filter(q => {
          const matchesSubject = q.subject === subject ||
            q.subject.includes(subject + ' /') ||  // "Matéria / Outra"
            q.subject.includes('/ ' + subject);    // "Outra / Matéria"
          return matchesSubject && !usedIds.has(q.id);
        });

        if (available.length > 0) {
          const shuffled = this.shuffleArray(available);
          finalSelection.push(shuffled[0]);
          usedIds.add(shuffled[0].id);
        }
      }
    }

    return this.shuffleArray(finalSelection);
  }

  /**
   * Modo Mista: Balanceia simultaneamente dificuldade E matérias
   * Proporções ETEC: 20% Fácil, 50% Médio, 30% Difícil
   */
  private distributeMixedMode(
    pool: Question[],
    targetCount: number,
    selectedSubjects: string[]
  ): Question[] {
    const easyCount = Math.round(targetCount * 0.20);
    const mediumCount = Math.round(targetCount * 0.50);
    const hardCount = Math.round(targetCount * 0.30);

    // Distribuir cada nível de dificuldade de forma balanceada entre matérias
    const easyQuestions = this.distributeBalanced(pool, easyCount, selectedSubjects, 'Fácil');
    const mediumQuestions = this.distributeBalanced(pool, mediumCount, selectedSubjects, 'Médio');
    const hardQuestions = this.distributeBalanced(pool, hardCount, selectedSubjects, 'Difícil');

    let combined = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    // Se não atingiu o total, completar sem filtro de dificuldade
    if (combined.length < targetCount) {
      const usedIds = new Set(combined.map(q => q.id));
      const remainingPool = pool.filter(q => !usedIds.has(q.id));
      const additional = this.distributeBalanced(
        remainingPool,
        targetCount - combined.length,
        selectedSubjects
      );
      combined = [...combined, ...additional];
    }

    return this.shuffleArray(combined.slice(0, targetCount));
  }

  async startQuiz() {
    if (this.config().selectedSubjects.length === 0) {
      alert('Selecione pelo menos uma matéria.');
      return;
    }

    this.isPreparing.set(true);
    this.loadingMessage.set('Preparando simulado...');

    try {
      const allQuestions = this.contentService.getQuestions();
      const targetCount = this.config().questionCount;
      const selectedSubjects = this.config().selectedSubjects;
      const selectedDifficulty = this.config().difficulty;

      // Filter out questions that are still blocked by spaced repetition
      const availableQuestions = allQuestions.filter(q =>
        this.questionHistory.canShowQuestion(q.id)
      );

      console.log(`🔄 Spaced repetition: ${allQuestions.length - availableQuestions.length} questions blocked`);

      // Filtrar questões por matérias selecionadas (FILTRO INTELIGENTE)
      // Aceita tanto matérias exatas quanto compostas
      // Ex: Se selecionou "Matemática", pega "Matemática" E "Matemática / Física"
      let pool = availableQuestions.filter(q => {
        return selectedSubjects.some(selectedMat => {
          // Aceita se a matéria é exata OU se contém a matéria selecionada
          return q.subject === selectedMat ||
            q.subject.includes(selectedMat + ' /') ||  // "Matemática / Física"
            q.subject.includes('/ ' + selectedMat);    // "Física / Matemática"
        });
      });

      let finalSelection: Question[] = [];

      // Aplicar distribuição balanceada
      if (selectedDifficulty === 'Mista') {
        finalSelection = this.distributeMixedMode(pool, targetCount, selectedSubjects);
      } else {
        // Dificuldade específica
        const difficultyPool = pool.filter(q => q.difficulty === selectedDifficulty);
        finalSelection = this.distributeBalanced(difficultyPool, targetCount, selectedSubjects, selectedDifficulty);
      }

      // Limitar ao número solicitado
      finalSelection = finalSelection.slice(0, targetCount);

      // Validações
      if (finalSelection.length === 0) {
        this.isPreparing.set(false); // Stop loading before showing alert

        const blockedCount = allQuestions.length - availableQuestions.length;
        if (blockedCount > 0) {
          const shouldClear = confirm(
            `Não há questões disponíveis!\n\n` +
            `${blockedCount} questões estão bloqueadas pelo sistema de repetição espaçada.\n\n` +
            `Deseja limpar o histórico e liberar todas as questões?`
          );
          if (shouldClear) {
            this.questionHistory.clearHistory();
            alert('✅ Histórico limpo com sucesso!\n\nTodas as questões estão disponíveis novamente.\n\nClique em "Começar Simulado" para tentar novamente.');
          }
        } else {
          alert('Não há questões disponíveis com os filtros selecionados. Tente outras matérias ou dificuldades.');
        }
        return;
      }

      // Avisar se há menos questões do que pedido
      if (finalSelection.length < targetCount) {
        const blockedCount = allQuestions.length - availableQuestions.length;
        let message = `Apenas ${finalSelection.length} questões disponíveis (você pediu ${targetCount}).`;

        if (blockedCount > 0) {
          message += `\n\n${blockedCount} questões estão bloqueadas pelo sistema de repetição espaçada.`;
          message += `\n\nDeseja continuar com ${finalSelection.length} questões ou limpar o histórico?`;
        } else {
          message += `\n\nDeseja continuar?`;
        }

        const proceed = confirm(message);
        if (!proceed) {
          this.isPreparing.set(false); // Stop loading before offering to clear

          // Offer to clear history if there are blocked questions
          if (blockedCount > 0) {
            const shouldClear = confirm('Deseja limpar o histórico e liberar todas as questões?');
            if (shouldClear) {
              this.questionHistory.clearHistory();
              alert('✅ Histórico limpo com sucesso!\n\nTodas as questões estão disponíveis novamente.\n\nClique em "Começar Simulado" para tentar novamente.');
            }
          }
          return;
        }

      }

      // Log de estatísticas MELHORADO
      const stats = {
        total: finalSelection.length,
        fácil: finalSelection.filter(q => q.difficulty === 'Fácil').length,
        médio: finalSelection.filter(q => q.difficulty === 'Médio').length,
        difícil: finalSelection.filter(q => q.difficulty === 'Difícil').length,
        porMateria: selectedSubjects.map(s => ({
          materia: s,
          count: finalSelection.filter(q => q.subject === s).length,
          percentual: ((finalSelection.filter(q => q.subject === s).length / finalSelection.length) * 100).toFixed(1) + '%'
        })),
        comRecursos: {
          imagem: finalSelection.filter(q => q.imageUrl).length,
          textoApoio: finalSelection.filter(q => q.supportText).length
        }
      };
      console.log('📊 Distribuição do Simulado:', stats);

      // Iniciar o quiz
      this.questions.set(finalSelection);
      this.currentIndex.set(0);
      this.score.set(0);
      this.quizFinished.set(false);
      this.quizActive.set(true);
      this.resetQuestionState();

      // Iniciar cronômetro se configurado
      if (this.config().timerMinutes > 0) {
        this.timeLeft.set(this.config().timerMinutes * 60);
        this.startTimer();
      } else {
        this.timeLeft.set(0);
      }

    } catch (e) {
      console.error(e);
      alert('Erro ao iniciar simulado.');
    } finally {
      this.isPreparing.set(false);
    }
  }

  // --- Timer Methods ---

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          this.stopTimer();
          this.finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formattedTime = computed(() => {
    const totalSeconds = this.timeLeft();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  // --- Quiz Methods ---

  resetQuestionState() {
    this.selectedOptionIndex.set(null);
    this.isAnswered.set(false);
    this.isCorrect.set(false);
    this.explanationText.set(null);
  }

  selectOption(index: number) {
    if (this.isAnswered()) return;
    this.selectedOptionIndex.set(index);
  }

  submitAnswer() {
    if (this.selectedOptionIndex() === null) return;

    const currentQ = this.questions()[this.currentIndex()];
    const correct = this.selectedOptionIndex() === currentQ.correctIndex;

    this.isCorrect.set(correct);
    this.isAnswered.set(true);

    if (correct) {
      this.score.update(s => s + 1);
    }

    // Record attempt for spaced repetition
    this.questionHistory.recordAttempt(currentQ.id, correct);

    this.contentService.updateStats(correct);
  }

  nextQuestion() {
    if (this.currentIndex() < this.questions().length - 1) {
      this.currentIndex.update(i => i + 1);
      this.resetQuestionState();
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz() {
    this.stopTimer();
    this.quizFinished.set(true);
  }

  exitQuiz() {
    this.stopTimer();
    this.quizActive.set(false);
    this.quizFinished.set(false);
  }

  showExplanation() {
    const q = this.questions()[this.currentIndex()];

    if (q.explanation) {
      this.explanationText.set(q.explanation);
    } else {
      this.explanationText.set('Esta questão não possui explicação disponível.');
    }
  }

  // --- Word Popup Methods ---

  /**
   * Handle text selection to show word definition
   */
  @HostListener('document:mouseup', ['$event'])
  handleTextSelection(event: MouseEvent) {
    // Only handle selections during active quiz
    if (!this.quizActive()) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      this.closeWordPopup();
      return;
    }

    const selectedText = selection.toString().trim();

    // Only process single words or short phrases (max 3 words)
    const wordCount = selectedText.split(/\s+/).length;
    if (wordCount > 3) {
      return;
    }

    // Get the first word for lookup
    const word = selectedText.split(/\s+/)[0].replace(/[.,!?;:]/g, '');

    // Get definition from dictionary
    const definitions = this.dictionary.getDefinition(word);

    if (definitions && definitions.length > 0) {
      // Get selection position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Set popup position (center of selection)
      this.popupPosition.set({
        x: rect.left + (rect.width / 2),
        y: rect.top
      });

      this.selectedWord.set(word);
      this.wordDefinitions.set(definitions);
      this.showWordPopup.set(true);
    }
  }

  /**
   * Close word popup
   */
  closeWordPopup() {
    this.showWordPopup.set(false);
    this.selectedWord.set('');
    this.wordDefinitions.set(null);
  }
}