import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { InscriptionService } from './inscription.service';
import { PersonnelService } from './personnel.service';

export interface ActionNotification {
  id: string;
  title: string;
  description: string;
  count: number;
  route: string;
  tone: 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ActionNotificationService {
  constructor(
    private authenticationService: AuthenticationService,
    private inscriptionService: InscriptionService,
    private personnelService: PersonnelService
  ) {
  }

  charger(): Observable<ActionNotification[]> {
    const role = this.authenticationService.currentProfile;
    const sources: Observable<ActionNotification | null>[] = [];
    const pagination = { page: 1, size: 1, sortField: 'id', sortOrder: 'DESC' as const, filter: '' };

    if (role && ['SEC', 'ADM', 'SADM'].includes(role)) {
      sources.push(
        this.inscriptionService
          .filterInscriptions([{ field: 'statut', condition: 'eq', value: 'EN_ATTENTE' }], pagination)
          .pipe(
            map((page) => this.notification(
              'inscriptions',
              'Inscriptions à valider',
              'Dossiers d’inscription en attente de décision',
              page.meta?.totalElements ?? page.content.length,
              '/inscriptions/suivi',
              'warning'
            )),
            catchError(() => of(null))
          ),
        this.inscriptionService
          .filterPaiements([{ field: 'statut', condition: 'eq', value: 'EN_ATTENTE' }], pagination)
          .pipe(
            map((page) => this.notification(
              'paiements',
              'Paiements à confirmer',
              'Paiements enregistrés en attente de confirmation',
              page.meta?.totalElements ?? page.content.length,
              '/inscriptions/paiements',
              'warning'
            )),
            catchError(() => of(null))
          )
      );
    }

    if (role && ['RH', 'ADM', 'SADM'].includes(role)) {
      sources.push(
        this.personnelService.dashboard().pipe(
          map((dashboard) => this.notification(
            'conges',
            'Congés à traiter',
            'Demandes de congé en attente de décision',
            Number(dashboard.conges_en_attente || 0),
            '/personnel',
            'info'
          )),
          catchError(() => of(null))
        )
      );
    }

    if (!sources.length) return of([]);
    return forkJoin(sources).pipe(
      map((notifications) => notifications.filter(
        (notification): notification is ActionNotification => notification !== null && notification.count > 0
      ))
    );
  }

  private notification(
    id: string,
    title: string,
    description: string,
    count: number,
    route: string,
    tone: ActionNotification['tone']
  ): ActionNotification | null {
    return count > 0 ? { id, title, description, count, route, tone } : null;
  }
}
