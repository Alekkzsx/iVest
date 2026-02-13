import { Injectable, signal, inject, effect } from '@angular/core';
import { QuestionLoaderService } from './question-loader.service';
import { UserDataService } from './user-data.service';
import { AchievementsService } from './achievements.service';
import { ChallengesService } from './challenges.service';

export interface Question {
  id: number;
  subject: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  imageUrl?: string;        // URL or path to question image
  supportText?: string;      // Support/reference text for context
  groupId?: number;          // Groups related questions together
  theme?: string;            // Question theme/topic
}

export interface StudySession {
  id: string;
  day: string;
  subject: string;
  topic: string;
  duration: string; // e.g. "2h" or "30min"
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {

  private questionLoader = inject(QuestionLoaderService);
  private userDataService = inject(UserDataService);
  private achievementsService = inject(AchievementsService);
  private challengesService = inject(ChallengesService);

  // Local questions loaded from files
  private loadedQuestions = signal<Question[]>([]);

  // Fallback database focused on ETEC themes (kept for backward compatibility)
  private fallbackQuestions: Question[] = [
    {
      id: 1,
      subject: 'Ciências',
      text: 'O conceito de desenvolvimento sustentável, fundamental para a preservação do meio ambiente, propõe:',
      options: [
        'A interrupção total do crescimento econômico.',
        'O uso esgotável dos recursos naturais.',
        'Atender às necessidades do presente sem comprometer as gerações futuras.',
        'A substituição de florestas por áreas agrícolas.',
        'O aumento do consumo de combustíveis fósseis.'
      ],
      correctIndex: 2,
      difficulty: 'Fácil'
    },
    {
      id: 2,
      subject: 'Matemática',
      text: 'Para reciclar alumínio, gasta-se apenas 5% da energia necessária para produzi-lo a partir do minério. Se a produção inicial gasta 100 kWh, quanta energia é economizada ao reciclar?',
      options: ['5 kWh', '95 kWh', '50 kWh', '20 kWh', '10 kWh'],
      correctIndex: 1,
      difficulty: 'Médio'
    },
    {
      id: 3,
      subject: 'História/Geo',
      text: 'A cidadania no Brasil implica direitos e deveres. Qual das alternativas representa um dever fundamental do cidadão em relação ao meio ambiente, segundo a Constituição?',
      options: [
        'Desmatar áreas privadas para construção.',
        'Defender e preservar o meio ambiente para as presentes e futuras gerações.',
        'Ignorar a coleta seletiva de lixo.',
        'Priorizar o transporte individual motorizado.',
        'Queimar resíduos sólidos em quintais.'
      ],
      correctIndex: 1,
      difficulty: 'Fácil'
    },
    {
      id: 4,
      subject: 'Português',
      text: 'Na frase "A reciclagem é vital, PORÉM, poucos praticam", a conjunção destacada expressa ideia de:',
      options: ['Adição', 'Explicação', 'Conclusão', 'Oposição', 'Alternância'],
      correctIndex: 3,
      difficulty: 'Médio'
    },
    {
      id: 5,
      subject: 'Ciências',
      text: 'O aquecimento global é agravado pelo efeito estufa. Qual gás é o principal responsável por esse fenômeno quando emitido em excesso pela queima de combustíveis fósseis?',
      options: ['Oxigênio (O2)', 'Nitrogênio (N2)', 'Dióxido de Carbono (CO2)', 'Hélio (He)', 'Hidrogênio (H2)'],
      correctIndex: 2,
      difficulty: 'Médio'
    },
    {
      id: 6,
      subject: 'Atualidades',
      text: 'Qual das alternativas abaixo é uma prática recomendada para combater o desperdício de água nas cidades?',
      options: [
        'Lavar calçadas com mangueira diariamente.',
        'Banhos demorados.',
        'Reuso de água da chuva e da máquina de lavar.',
        'Deixar torneiras pingando.',
        'Não consertar vazamentos.'
      ],
      correctIndex: 2,
      difficulty: 'Fácil'
    },
    {
      id: 7,
      subject: 'Matemática',
      text: 'Um tanque com 1000 litros de água vaza 50ml por minuto. Em quanto tempo o tanque perderá 3 litros?',
      options: ['30 minutos', '45 minutos', '60 minutos', '15 minutos', '90 minutos'],
      correctIndex: 2,
      difficulty: 'Difícil'
    },
    {
      id: 8,
      subject: 'História/Geo',
      text: 'O processo de urbanização no Brasil se intensificou a partir da década de 1950. Qual foi o principal fator impulsionador?',
      options: ['Reforma Agrária', 'Industrialização', 'Êxodo Urbano', 'Mineração', 'Turismo'],
      correctIndex: 1,
      difficulty: 'Médio'
    },
    {
      id: 9,
      subject: 'História/Geo',
      text: 'A Revolução Industrial transformou as relações de trabalho. Qual classe social surgiu com o fortalecimento das indústrias?',
      options: ['Nobreza', 'Clero', 'Proletariado', 'Feudal', 'Escravos'],
      correctIndex: 2,
      difficulty: 'Fácil'
    },
    {
      id: 10,
      subject: 'Matemática',
      text: 'Se um produto custa R$ 120,00 e tem um desconto de 20%, qual o valor final?',
      options: ['R$ 100,00', 'R$ 96,00', 'R$ 90,00', 'R$ 110,00', 'R$ 24,00'],
      correctIndex: 1,
      difficulty: 'Fácil'
    },
    {
      id: 11,
      subject: 'Ciências',
      text: 'Qual é a principal função da fotossíntese para as plantas?',
      options: ['Produzir oxigênio para os humanos', 'Produzir seu próprio alimento (glicose)', 'Absorver calor', 'Proteger contra pragas', 'Consumir terra'],
      correctIndex: 1,
      difficulty: 'Médio'
    },
    {
      id: 12,
      subject: 'Português',
      text: 'Assinale a alternativa onde o uso da crase está CORRETO:',
      options: ['Vou à comprar pão.', 'Fomos à pé.', 'Chegamos à cidade.', 'Ela falou à todos.', 'Entreguei o livro à ele.'],
      correctIndex: 2,
      difficulty: 'Difícil'
    },
    {
      id: 13,
      subject: 'Atualidades',
      text: 'Qual bioma brasileiro tem sofrido com recordes de queimadas nos últimos anos, afetando a biodiversidade do Centro-Oeste?',
      options: ['Amazônia', 'Pampas', 'Caatinga', 'Pantanal', 'Mata de Araucárias'],
      correctIndex: 3,
      difficulty: 'Médio'
    },
    {
      id: 14,
      subject: 'Ciências',
      text: 'A energia cinética está relacionada ao:',
      options: ['Calor', 'Movimento', 'Altura', 'Som', 'Luz'],
      correctIndex: 1,
      difficulty: 'Fácil'
    },
    {
      id: 15,
      subject: 'Ciências',
      text: 'A água é uma substância composta por dois elementos químicos. Quais são?',
      options: ['Hélio e Oxigênio', 'Hidrogênio e Nitrogênio', 'Carbono e Oxigênio', 'Hidrogênio e Oxigênio', 'Nitrogênio e Carbono'],
      correctIndex: 3,
      difficulty: 'Fácil'
    },
    {
      id: 16,
      subject: 'Ciências',
      text: 'Qual organela celular é responsável pela respiração celular e produção de energia?',
      options: ['Ribossomo', 'Lisossomo', 'Mitocôndria', 'Complexo de Golgi', 'Núcleo'],
      correctIndex: 2,
      difficulty: 'Difícil'
    },
    {
      id: 17,
      subject: 'História/Geo',
      text: 'Quem foi o presidente do Brasil conhecido como "Pai dos Pobres" e criador da CLT?',
      options: ['Juscelino Kubitschek', 'Getúlio Vargas', 'Marechal Deodoro', 'Dom Pedro II', 'Lula'],
      correctIndex: 1,
      difficulty: 'Médio'
    },
    {
      id: 18,
      subject: 'História/Geo',
      text: 'A Mata Atlântica é um bioma que abrange a costa brasileira. Qual sua principal característica atual?',
      options: ['Está intocada.', 'É o bioma mais preservado.', 'Resta menos de 15% da cobertura original.', 'É um deserto.', 'Só existe no sul.'],
      correctIndex: 2,
      difficulty: 'Médio'
    },
    {
      id: 19,
      subject: 'Matemática',
      text: 'A área de um quadrado de lado 5cm é:',
      options: ['10 cm²', '20 cm²', '25 cm²', '15 cm²', '5 cm²'],
      correctIndex: 2,
      difficulty: 'Fácil'
    },
    {
      id: 20,
      subject: 'Português',
      text: 'Identifique o sujeito na frase: "Os alunos da ETEC passaram no vestibulinho."',
      options: ['Passaram', 'Vestibulinho', 'Os alunos da ETEC', 'ETEC', 'Indeterminado'],
      correctIndex: 2,
      difficulty: 'Fácil'
    }
  ];

  stats = signal({
    questionsAnswered: 0,
    correctAnswers: 0,
    currentStreak: 0,
    xp: 0,
    level: 1,
    essaysWritten: 0
  });

  schedule = signal<StudySession[]>([]);

  constructor() {
    // Load data from backend on initialization
    this.initializeData();

    // Granular Auto-saves
    // Effect to auto-save stats on change
    effect(() => {
      const stats = this.stats();
      if (stats) {
        this.userDataService.saveUserProfile(stats); // Changed from saveStats to saveUserProfile to match existing code
      }
    });

    // Effect to auto-save gamification data
    effect(() => {
      // Watch for changes in achievements or challenges
      const achievements = this.achievementsService.unlockedAchievements();
      const challenges = this.challengesService.userChallenges();

      // Save to backend
      this.userDataService.saveGamificationData({
        achievements,
        challenges,
        completedSessions: [],
        consecutiveCorrect: 0,
        subjectStats: []
      });
    });

    effect(() => {
      const currentSchedule = this.schedule();
      this.userDataService.saveUserSchedule(currentSchedule);
    });
  }

  /**
   * Initialize data from backend
   */
  private async initializeData(): Promise<void> {
    try {
      // Load data from backend
      const userData = await this.userDataService.loadUserData();

      // Update stats (This will trigger the stats effect, but UserDataService handles it)
      this.stats.set(userData.user.stats);

      // Update schedule (This will trigger the schedule effect)
      this.schedule.set(userData.user.schedule);

      console.log('✅ ContentService initialized with backend data');
    } catch (error) {
      console.error('❌ Error initializing data:', error);
    }
  }

  /**
   * Load questions from local files via HTTP
   */
  async loadQuestionsFromFiles(filenames?: string[]): Promise<void> {
    try {
      let questions: Question[];

      if (filenames && filenames.length > 0) {
        questions = await this.questionLoader.loadQuestionsFromFiles(filenames);
      } else {
        // Load all questions by default
        questions = await this.questionLoader.loadAllQuestions();
      }

      this.loadedQuestions.set(questions);
      console.log(`ContentService: Loaded ${questions.length} questions total`);
    } catch (error) {
      console.error('Error loading questions from files:', error);
      // Keep using fallback questions
    }
  }

  /**
   * Get all available questions (from files or fallback)
   */
  getQuestions(): Question[] {
    const loaded = this.loadedQuestions();
    return loaded.length > 0 ? [...loaded] : [...this.fallbackQuestions];
  }

  /**
   * Standard ETEC subjects (main matérias only, not sub-themes)
   */
  private readonly STANDARD_SUBJECTS = [
    'Matemática',
    'Português',
    'Biologia',
    'Física',
    'Química',
    'História',
    'Geografia',
    'Sociologia',
    'Filosofia',
    'Inglês',
    'Artes',
    'Atualidades',
  ];

  /**
   * Get main subjects that have questions available.
   * Only returns standard matérias (not sub-themes like "Saúde" or "Tecnologia").
   * The quiz filter already handles composite subjects like "Química / Saúde"
   * by matching them to "Química".
   */
  getSubjects(): string[] {
    const questions = this.getQuestions();

    // Return only standard subjects that have at least one question
    return this.STANDARD_SUBJECTS.filter(subject => {
      return questions.some(q =>
        q.subject === subject ||
        q.subject.startsWith(subject + ' /') ||
        q.subject.includes('/ ' + subject)
      );
    });
  }

  /**
   * Get available question files
   */
  getAvailableFiles() {
    return this.questionLoader.availableFiles;
  }

  /**
   * Get question loading state
   */
  isLoadingQuestions() {
    return this.questionLoader.isLoading();
  }

  /**
   * Get loading progress
   */
  getLoadingProgress() {
    return this.questionLoader.loadingProgress();
  }

  updateStats(isCorrect: boolean, subject?: string) {
    this.stats.update(val => {
      // XP Calculation: 50 XP for correct answer, 10 XP for effort (wrong answer)
      const earnedXp = isCorrect ? 50 : 10;
      const newXp = val.xp + earnedXp;

      // Level Calculation: 1000 XP per level
      const newLevel = Math.floor(newXp / 1000) + 1;

      const newStats = {
        ...val,
        questionsAnswered: val.questionsAnswered + 1,
        correctAnswers: isCorrect ? val.correctAnswers + 1 : val.correctAnswers,
        xp: newXp,
        level: newLevel
      };

      // Update challenges
      this.challengesService.updateProgress('daily_questions', 1);
      if (isCorrect) {
        this.challengesService.updateProgress('daily_correct', 1);
      }
      if (subject) {
        this.challengesService.updateProgress(`daily_subject_${subject}`, 1);
      }

      // Check for achievements
      this.achievementsService.checkAchievements(newStats);

      return newStats;
    });

    // Auto-save is triggered by effect
  }

  incrementEssayCount() {
    this.stats.update(val => {
      // XP for essay: 100 XP
      const earnedXp = 100;
      const newXp = val.xp + earnedXp;
      const newLevel = Math.floor(newXp / 1000) + 1;

      return {
        ...val,
        essaysWritten: (val.essaysWritten || 0) + 1,
        xp: newXp,
        level: newLevel
      };
    });

    // Auto-save is triggered by effect
  }

  addScheduleItem(item: Omit<StudySession, 'id'>) {
    this.schedule.update(items => [...items, { ...item, id: crypto.randomUUID() }]);
  }

  removeScheduleItem(id: string) {
    this.schedule.update(items => items.filter(i => i.id !== id));
  }

  setSchedule(items: StudySession[]) {
    this.schedule.set(items);
  }
}