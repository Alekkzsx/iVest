import { Component, signal, inject, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { TextInterpretationComponent } from './components/text-interpretation/text-interpretation.component';
import { ResolutionsComponent } from './components/resolutions/resolutions.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { ContentService } from './services/content.service';

type View = 'dashboard' | 'quiz' | 'interpretation' | 'performance' | 'schedule' | 'resolutions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    QuizComponent,
    TextInterpretationComponent,
    ResolutionsComponent,
    ScheduleComponent
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  contentService = inject(ContentService);

  currentView = signal<View>('dashboard');
  sidebarOpen = signal(false); // Mobile drawer
  isCollapsed = signal(false); // Desktop collapse

  // Navigation Items - Strictly ETEC focused
  navItems = [
    { id: 'dashboard', label: 'Início', icon: 'fa-home', isNew: false },
    { id: 'schedule', label: 'Cronograma', icon: 'fa-calendar-alt', isNew: false },
    { id: 'quiz', label: 'Simulado', icon: 'fa-pen-square', isNew: false },
    { id: 'interpretation', label: 'Interpretação', icon: 'fa-book-open', isNew: true },
    { id: 'resolutions', label: 'Resoluções', icon: 'fa-check-double', isNew: true },
    { id: 'performance', label: 'Desempenho', icon: 'fa-chart-line', isNew: false }
  ];

  // Gamification State
  stats = this.contentService.stats;

  // Global Timer State
  targetDate = new Date('2025-06-08T13:30:00');
  timeLeft = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  private intervalId: any;

  ngOnInit() {
    this.updateTimer();
    this.intervalId = setInterval(() => this.updateTimer(), 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTimer() {
    const now = new Date().getTime();
    const distance = this.targetDate.getTime() - now;

    if (distance < 0) {
      this.timeLeft.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.timeLeft.set({ days, hours, minutes, seconds });
  }

  xpProgress = computed(() => {
    const xp = this.stats().xp;
    const level = this.stats().level;
    const xpForNextLevel = level * 1000;
    const xpForCurrentLevel = (level - 1) * 1000;

    // Calculate percentage within current level
    const currentLevelProgress = xp - xpForCurrentLevel;
    const levelRange = xpForNextLevel - xpForCurrentLevel;

    return Math.min(Math.max((currentLevelProgress / levelRange) * 100, 0), 100);
  });

  nextLevelThreshold = computed(() => this.stats().level * 1000);

  setView(view: string) {
    this.currentView.set(view as View);
    this.sidebarOpen.set(false); // Close sidebar on mobile after selection
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  toggleCollapse() {
    this.isCollapsed.update(v => !v);
  }
}