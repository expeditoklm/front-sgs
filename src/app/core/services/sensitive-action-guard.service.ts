import { Injectable, OnDestroy } from '@angular/core';
import { ActionConfirmationService } from './action-confirmation.service';

interface ConfirmationCopy {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'default' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class SensitiveActionGuardService implements OnDestroy {
  private installed = false;
  private readonly replaying = new WeakSet<HTMLElement>();
  private readonly listener = (event: MouseEvent) => this.intercept(event);

  constructor(private confirmations: ActionConfirmationService) {
  }

  install(): void {
    if (this.installed) return;
    document.addEventListener('click', this.listener, true);
    this.installed = true;
  }

  ngOnDestroy(): void {
    if (this.installed) document.removeEventListener('click', this.listener, true);
  }

  private intercept(event: MouseEvent): void {
    if (event.button !== 0 || event.defaultPrevented) return;
    const origin = event.target;
    if (!(origin instanceof Element)) return;

    const action = origin.closest<HTMLElement>('button, [role="button"], a');
    if (!action || action.hasAttribute('disabled') || action.getAttribute('aria-disabled') === 'true') return;
    if (action.closest('app-global-action-confirmation, app-confirm-dialog')) return;
    if (action.closest('[data-confirm-skip="true"]') || action.dataset['confirmSkip'] === 'true') return;
    if (this.replaying.has(action)) {
      this.replaying.delete(action);
      return;
    }

    const copy = this.copyFor(action);
    if (!copy) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    this.confirmations.ask(copy).then((confirmed) => {
      if (!confirmed || !action.isConnected) return;
      this.replaying.add(action);
      action.click();
    });
  }

  private copyFor(action: HTMLElement): ConfirmationCopy | null {
    const explicit = action.dataset['confirmAction'];
    const raw = explicit || [
      action.getAttribute('aria-label'),
      action.getAttribute('title'),
      action.textContent
    ].filter(Boolean).join(' ');
    const value = this.normalize(raw);

    if (!value) return null;
    if (this.contains(value, ['supprimer', 'suppression', 'retirer', 'detacher'])) {
      return this.copy('Confirmer la suppression', 'Cette suppression peut être définitive. Voulez-vous continuer ?', 'Supprimer', 'danger');
    }
    if (this.contains(value, ['refuser', 'refus', 'rejeter', 'rejet'])) {
      return this.copy('Confirmer le refus', 'Voulez-vous réellement refuser ou rejeter cet élément ?', 'Confirmer le refus', 'danger');
    }
    if (this.contains(value, [
      'suspendre',
      'suspension',
      'desactiver',
      'reactiver',
      'activer',
      'cloturer',
      'rompre',
      'ouvrir la session',
      'changer etat',
      'changement etat'
    ])) {
      return this.copy('Confirmer le changement d’état', 'Cette action modifiera l’état de cet élément. Voulez-vous continuer ?', 'Continuer', 'danger');
    }
    if (this.contains(value, [
      'valider',
      'validation',
      'approuver',
      'accepter',
      'confirmer',
      'publier',
      'justifier',
      'soumettre',
      'transmettre'
    ])) {
      return this.copy('Confirmer l’action', 'Vérifiez les informations avant de confirmer cette action.', 'Confirmer', 'default');
    }
    if (this.contains(value, [
      'mettre a jour',
      'enregistrer',
      'sauvegarder',
      'remplacer',
      'appliquer la decision',
      'remettre en brouillon',
      'rattacher',
      'detacher',
      'affecter'
    ])) {
      return this.copy('Confirmer la modification', 'Voulez-vous enregistrer les modifications apportées ?', 'Enregistrer', 'default');
    }
    if (value.includes('annuler ') || value.includes('annulation')) {
      return this.copy('Confirmer l’annulation', 'Voulez-vous réellement annuler cet élément ?', 'Confirmer l’annulation', 'danger');
    }
    return null;
  }

  private copy(title: string, message: string, confirmLabel: string, tone: 'default' | 'danger'): ConfirmationCopy {
    return { title, message, confirmLabel, tone };
  }

  private contains(value: string, terms: string[]): boolean {
    return terms.some((term) => value.includes(term));
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
}
