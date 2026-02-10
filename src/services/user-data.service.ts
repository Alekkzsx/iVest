import { Injectable, signal } from '@angular/core';
import { Subject, debounceTime, switchMap, catchError, of, firstValueFrom } from 'rxjs';

/**
 * Interface representing the complete user data structure
 */
export interface UserData {
    version: string;
    lastUpdated: string;
    user: {
        stats: {
            questionsAnswered: number;
            correctAnswers: number;
            currentStreak: number;
            xp: number;
            level: number;
            essaysWritten: number;
        };
        questionHistory: Array<{
            questionId: number;
            timestamp: number;
            wasCorrect: boolean;
        }>;
        interpretationHistory: Array<{
            questionId: number;
            timestamp: number;
            wasCorrect: boolean;
        }>;
        resolutionsHistory: Array<{
            questionId: number;
            timestamp: number;
            viewedAt: number;
        }>;
        schedule: Array<{
            id: string;
            day: string;
            subject: string;
            topic: string;
            duration: string;
        }>;
    };
}

/**
 * Service to manage user data persistence with backend API
 */
@Injectable({
    providedIn: 'root'
})
export class UserDataService {
    private readonly API_BASE = '/api/user/davi';

    // Status Signals
    isLoading = signal(false);
    syncStatus = signal<'synced' | 'saving' | 'error'>('synced');
    lastSaved = signal<Date | null>(null);

    // User data cache (Frontend "View" of the DB)
    private userData = signal<UserData | null>(null);

    // Debounce Subjects
    private profileUpdate$ = new Subject<any>();
    private historyUpdate$ = new Subject<any[]>();
    private interpretationUpdate$ = new Subject<any[]>();
    private resolutionsUpdate$ = new Subject<any[]>();
    private scheduleUpdate$ = new Subject<any[]>();

    constructor() {
        this.setupDebouncedSaves();
    }

    /**
     * Set up debounced auto-saves using RxJS
     */
    private setupDebouncedSaves() {
        // Debounced Profile Save
        this.profileUpdate$.pipe(
            debounceTime(1000),
            switchMap(stats => {
                this.syncStatus.set('saving');
                return fetch(`${this.API_BASE}/profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stats })
                }).then(res => res.json());
            }),
            catchError(err => {
                console.error('❌ Error saving profile:', err);
                this.syncStatus.set('error');
                return of(null);
            })
        ).subscribe(() => {
            this.syncStatus.set('synced');
            this.lastSaved.set(new Date());
        });

        // Debounced History Save
        this.historyUpdate$.pipe(
            debounceTime(1500),
            switchMap(history => {
                this.syncStatus.set('saving');
                return fetch(`${this.API_BASE}/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(history)
                }).then(res => res.json());
            }),
            catchError(err => {
                console.error('❌ Error saving history:', err);
                this.syncStatus.set('error');
                return of(null);
            })
        ).subscribe(() => {
            this.syncStatus.set('synced');
            this.lastSaved.set(new Date());
        });

        // Debounced Interpretation Save
        this.interpretationUpdate$.pipe(
            debounceTime(1500),
            switchMap(history => {
                this.syncStatus.set('saving');
                return fetch(`${this.API_BASE}/interpretation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(history)
                }).then(res => res.json());
            }),
            catchError(err => {
                console.error('❌ Error saving interpretation history:', err);
                this.syncStatus.set('error');
                return of(null);
            })
        ).subscribe(() => {
            this.syncStatus.set('synced');
            this.lastSaved.set(new Date());
        });

        // Debounced Resolutions Save
        this.resolutionsUpdate$.pipe(
            debounceTime(1500),
            switchMap(history => {
                this.syncStatus.set('saving');
                return fetch(`${this.API_BASE}/resolutions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(history)
                }).then(res => res.json());
            }),
            catchError(err => {
                console.error('❌ Error saving resolutions history:', err);
                this.syncStatus.set('error');
                return of(null);
            })
        ).subscribe(() => {
            this.syncStatus.set('synced');
            this.lastSaved.set(new Date());
        });

        // Debounced Schedule Save
        this.scheduleUpdate$.pipe(
            debounceTime(1000),
            switchMap(schedule => {
                this.syncStatus.set('saving');
                return fetch(`${this.API_BASE}/schedule`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(schedule)
                }).then(res => res.json());
            }),
            catchError(err => {
                console.error('❌ Error saving schedule:', err);
                this.syncStatus.set('error');
                return of(null);
            })
        ).subscribe(() => {
            this.syncStatus.set('synced');
            this.lastSaved.set(new Date());
        });
    }

    /**
     * Load full user data from the File Database (V4)
     */
    async loadUserData(): Promise<UserData> {
        this.isLoading.set(true);

        try {
            const response = await fetch(`${this.API_BASE}/full`);
            if (!response.ok) throw new Error('Server unreachable');

            const data = await response.json();
            this.userData.set(data);
            console.log('✅ User data loaded from User DB');
            return data;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            const empty = this.createDefaultData();
            this.userData.set(empty);
            this.syncStatus.set('error');
            return empty;
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Save PROFILE (Stats/XP/Level)
     */
    saveUserProfile(stats: any): void {
        // Update local cache
        this.userData.update(current => {
            if (!current) return current;
            return { ...current, user: { ...current.user, stats: stats } };
        });

        // Push to debounce stream
        this.profileUpdate$.next(stats);
    }

    /**
     * Save HISTORY
     */
    saveUserHistory(history: any[]): void {
        this.userData.update(current => {
            if (!current) return current;
            return { ...current, user: { ...current.user, questionHistory: history } };
        });

        this.historyUpdate$.next(history);
    }

    /**
     * Save SCHEDULE
     */
    saveUserSchedule(schedule: any[]): void {
        this.userData.update(current => {
            if (!current) return current;
            return { ...current, user: { ...current.user, schedule: schedule } };
        });

        this.scheduleUpdate$.next(schedule);
    }

    /**
     * Save Interpretation HISTORY
     */
    saveUserInterpretationHistory(history: any[]): void {
        this.userData.update(current => {
            if (!current) return current;
            return { ...current, user: { ...current.user, interpretationHistory: history } };
        });

        this.interpretationUpdate$.next(history);
    }

    /**
     * Save Resolutions HISTORY
     */
    saveUserResolutionsHistory(history: any[]): void {
        this.userData.update(current => {
            if (!current) return current;
            return { ...current, user: { ...current.user, resolutionsHistory: history } };
        });

        this.resolutionsUpdate$.next(history);
    }

    getUserData(): UserData | null {
        return this.userData();
    }

    private createDefaultData(): UserData {
        return {
            version: '4.0.0',
            lastUpdated: new Date().toISOString(),
            user: {
                stats: { questionsAnswered: 0, correctAnswers: 0, currentStreak: 0, xp: 0, level: 1, essaysWritten: 0 },
                questionHistory: [],
                interpretationHistory: [],
                resolutionsHistory: [],
                schedule: []
            }
        };
    }
}
