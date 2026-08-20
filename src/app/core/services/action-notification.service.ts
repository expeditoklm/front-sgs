import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from './authentication.service';
import { InscriptionService } from './inscription.service';
import { PersonnelService } from './personnel.service';
import { SaasService } from './saas.service';

export interface ActionNotification {
  id: string;
  title: string;
  description: string;
  count: number;
  route: string;
  tone: 'warning' | 'info';
  inboxId?: string;
}

@Injectable({ providedIn: 'root' })
export class ActionNotificationService {
  constructor(
    private authenticationService: AuthenticationService,
    private inscriptionService: InscriptionService,
    private personnelService: PersonnelService,
    private saasService: SaasService,
    private http: HttpClient
  ) {
  }

  charger(): Observable<ActionNotification[]> {
    const role = this.authenticationService.currentProfile;
    const sources: Observable<ActionNotification | null>[] = [];
    const pagination = { page: 1, size: 1, sortField: 'id', sortOrder: 'DESC' as const, filter: '' };

    sources.push(
      this.http.get<{ data: any[] }>(`${environment.apiUrl}/referentiels/notifications/me`, {
        params: { unreadOnly: true }
      }).pipe(
        map((response) => response.data ?? []),
        map((items) => items.map((item) => ({
          id: `inbox-${item.uuid}`,
          inboxId: item.uuid,
          title: item.title,
          description: item.message,
          count: 1,
          route: item.route || '/mon-profil',
          tone: 'info' as const
        }))),
        catchError(() => of([]))
      ) as Observable<any>
    );

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

    if (role && ['ADM', 'SADM'].includes(role)) {
      sources.push(
        this.authenticationService.accountRequests$('PENDING').pipe(
          map((requests) => this.notification(
            'demandes-compte',
            'Demandes de compte à traiter',
            'Nouvelles demandes en attente de validation et d’attribution des rôles',
            requests.length,
            '/administration/demandes-compte',
            'warning'
          )),
          catchError(() => of(null))
        )
      );
    }

    if (role === 'SADM') {
      sources.push(
        this.saasService.tenants().pipe(
          map((tenants) => this.notification(
            'demandes-ecole',
            'Écoles à valider',
            'Nouvelles demandes d’ouverture d’école en attente de décision',
            tenants.filter((tenant) => tenant.status === 'PENDING_REVIEW').length,
            '/saas/ecoles',
            'warning'
          )),
          catchError(() => of(null))
        )
      );
    }

    return forkJoin(sources).pipe(
      map((notifications) => notifications.flatMap((notification: any) =>
        Array.isArray(notification) ? notification : [notification]
      ).filter(
        (notification): notification is ActionNotification => notification !== null && notification.count > 0
      ))
    );
  }

  marquerCommeLue(notification: ActionNotification): Observable<void> {
    if (!notification.inboxId) return of(void 0);
    return this.http.patch<void>(
      `${environment.apiUrl}/referentiels/notifications/${notification.inboxId}/read`,
      {}
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
