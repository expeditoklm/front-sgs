import { Injectable, signal } from '@angular/core';
import { ToastMessage, ToastVariant } from '../models/toast.models';

// Notifications éphémères cohérentes pour tout l'app (création/modification/suppression, erreurs
// de chargement, ...) - un seul point d'entrée plutôt qu'un message inline différent par écran.
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly durationMs = 5000;

  toasts = signal<ToastMessage[]>([]);

  success(message: string, title = 'Succès'): void {
    this.show('success', title, message);
  }

  error(message: string, title = 'Erreur'): void {
    this.show('error', title, message);
  }

  warning(message: string, title = 'Attention'): void {
    this.show('warning', title, message);
  }

  info(message: string, title = 'Information'): void {
    this.show('info', title, message);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }

  private show(variant: ToastVariant, title: string, message: string): void {
    const duplicate = this.toasts().find((toast) => toast.variant === variant && toast.title === title && toast.message === message);
    if (duplicate) {
      this.dismiss(duplicate.id);
    }
    const toast: ToastMessage = { id: this.nextId++, variant, title, message };
    this.toasts.update((current) => [...current, toast]);
    setTimeout(() => this.dismiss(toast.id), this.durationMs);
  }
}
