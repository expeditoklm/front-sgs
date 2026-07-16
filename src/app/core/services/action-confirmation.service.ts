import { Injectable, signal } from '@angular/core';

export interface ActionConfirmationRequest {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'default' | 'danger';
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ActionConfirmationService {
  readonly request = signal<ActionConfirmationRequest | null>(null);

  ask(options: Omit<ActionConfirmationRequest, 'resolve'>): Promise<boolean> {
    if (this.request()) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => this.request.set({ ...options, resolve }));
  }

  answer(confirmed: boolean): void {
    const current = this.request();
    if (!current) return;
    this.request.set(null);
    current.resolve(confirmed);
  }
}
