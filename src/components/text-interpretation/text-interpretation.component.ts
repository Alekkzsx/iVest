import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterpretationService } from '../../services/interpretation.service';
import { ContentService } from '../../services/content.service';
import { LatexPipe } from '../../pipes/latex.pipe';

type ViewState = 'config' | 'activity' | 'loading' | 'error';

@Component({
  selector: 'app-text-interpretation',
  standalone: true,
  imports: [CommonModule, FormsModule, LatexPipe],
  templateUrl: './text-interpretation.component.html',
  styleUrl: './text-interpretation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextInterpretationComponent implements OnInit {
  private interpretationService = inject(InterpretationService);
  private contentService = inject(ContentService);

  // View state
  viewState = signal<ViewState>('loading');
  errorMessage = signal<string | null>(null);

  // Config state (tela inicial)
  selectedDifficulty = signal<'Fácil' | 'Médio' | 'Difícil' | 'Todas'>('Todas');
  selectedQuestionCount = signal<number>(3);

  // Activity state
  currentGroup = this.interpretationService.currentGroup;
  currentQuestionIndex = signal(0); // Índice da questão atual dentro do grupo
  currentQuestion = computed(() => {
    const group = this.currentGroup();
    if (!group) return null;
    return group.questions[this.currentQuestionIndex()];
  });

  // User answers
  selectedAnswer = signal<number | null>(null);
  hasAnswered = signal(false);
  isCorrect = signal(false);

  // Stats
  totalCorrect = signal(0);
  totalAnswered = signal(0);

  async ngOnInit() {
    try {
      await this.interpretationService.loadInterpretations();

      // DEBUG: Verificar dados carregados
      const testGroup = this.interpretationService.getCurrentGroup();
      if (testGroup) {
        console.log('✓ Grupo carregado:', testGroup);
        console.log('✓ Primeira questão:', testGroup.questions[0]);
        console.log('  - options:', testGroup.questions[0].options);
        console.log('  - explanation:', testGroup.questions[0].explanation);
      }

      this.viewState.set('config');
    } catch (error) {
      console.error('Error loading interpretations:', error);
      this.errorMessage.set('Erro ao carregar textos de interpretação.');
      this.viewState.set('error');
    }
  }

  /**
   * Inicia a atividade com as configurações selecionadas
   */
  startActivity() {
    this.viewState.set('activity');
    this.resetActivity();
  }

  /**
   * Volta para tela de configuração
   */
  backToConfig() {
    this.viewState.set('config');
    this.resetActivity();
  }

  /**
   * Reseta toda a atividade
   */
  private resetActivity() {
    this.currentQuestionIndex.set(0);
    this.selectedAnswer.set(null);
    this.hasAnswered.set(false);
    this.totalCorrect.set(0);
    this.totalAnswered.set(0);
    this.interpretationService.goToGroup(0);
  }

  /**
   * Seleciona uma resposta
   */
  selectAnswer(optionIndex: number) {
    if (this.hasAnswered()) return;
    this.selectedAnswer.set(optionIndex);
  }

  /**
   * Verifica a resposta
   */
  verifyAnswer() {
    const question = this.currentQuestion();
    if (!question || this.selectedAnswer() === null) return;

    const correct = this.selectedAnswer() === question.correctIndex;
    this.isCorrect.set(correct);
    this.hasAnswered.set(true);
    this.totalAnswered.update(n => n + 1);

    if (correct) {
      this.totalCorrect.update(n => n + 1);
      this.contentService.updateStats(true);
    } else {
      this.contentService.updateStats(false);
    }
  }

  /**
   * Avança para próxima questão
   */
  nextQuestion() {
    const group = this.currentGroup();
    if (!group) return;

    // Se ainda há questões no grupo atual
    if (this.currentQuestionIndex() < group.questions.length - 1) {
      this.currentQuestionIndex.update(i => i + 1);
      this.resetQuestionState();
    }
    // Se acabaram as questões, vai para próximo grupo
    else if (this.interpretationService.nextGroup()) {
      this.currentQuestionIndex.set(0);
      this.resetQuestionState();
    }
    // Se não há mais grupos, volta para config
    else {
      this.showFinalResults();
    }
  }

  /**
   * Reseta estado da questão atual
   */
  private resetQuestionState() {
    this.selectedAnswer.set(null);
    this.hasAnswered.set(false);
    this.isCorrect.set(false);
  }

  /**
   * Mostra resultados finais
   */
  private showFinalResults() {
    alert(`Atividade concluída!\n\nVocê acertou ${this.totalCorrect()} de ${this.totalAnswered()} questões.\nPercentual: ${Math.round((this.totalCorrect() / this.totalAnswered()) * 100)}%`);
    this.backToConfig();
  }

  /**
   * Verifica se opção está selecionada
   */
  isSelected(optionIndex: number): boolean {
    return this.selectedAnswer() === optionIndex;
  }

  /**
   * Verifica se é a resposta correta (após verificar)
   */
  isCorrectOption(optionIndex: number): boolean {
    if (!this.hasAnswered()) return false;
    const question = this.currentQuestion();
    return question ? question.correctIndex === optionIndex : false;
  }

  /**
   * Verifica se é a resposta errada selecionada (após verificar)
   */
  isWrongOption(optionIndex: number): boolean {
    if (!this.hasAnswered()) return false;
    return this.isSelected(optionIndex) && !this.isCorrectOption(optionIndex);
  }

  /**
   * Pode verificar a resposta
   */
  canVerify(): boolean {
    return this.selectedAnswer() !== null && !this.hasAnswered();
  }

  /**
   * Progresso atual
   */
  getProgress(): string {
    const group = this.currentGroup();
    if (!group) return '';

    const questionNum = this.currentQuestionIndex() + 1;
    const totalQuestions = group.questions.length;
    const groupNum = this.interpretationService.getCurrentIndex() + 1;
    const totalGroups = this.interpretationService.totalGroups();

    return `Grupo ${groupNum}/${totalGroups} - Questão ${questionNum}/${totalQuestions}`;
  }

  /**
   * Converte índice para letra (0 → A, 1 → B, etc.)
   */
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
