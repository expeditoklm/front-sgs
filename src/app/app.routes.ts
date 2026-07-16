import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AccountSettingsComponent } from './pages/account-settings/account-settings.component';
import { SupportComponent } from './pages/support/support.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { AccountRequestComponent } from './pages/auth-pages/account-request/account-request.component';
import { AccountRequestsComponent } from './pages/administration/account-requests/account-requests.component';
import { ResetPasswordComponent } from './pages/auth-pages/reset-password/reset-password.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { PersonnelDashboardComponent } from './pages/personnel/personnel-dashboard.component';
import { MonEspacePersonnelComponent } from './pages/personnel/mon-espace-personnel.component';
import { EvaluationsDetailleesComponent } from './pages/personnel/evaluations-detaillees.component';
import { PortailComponent } from './pages/portail/portail.component';
import { PortailAdministrationComponent } from './pages/portail/portail-administration.component';
import { AuditLogComponent } from './pages/audit/audit-log.component';
import { ReferentielPageComponent } from './pages/referentiels/referentiel-page.component';
import { REFERENTIEL_CRUD_ENTITIES } from './core/models/referentiel-crud.models';
import { EleveListComponent } from './pages/inscriptions/eleve-list/eleve-list.component';
import { EleveDossierComponent } from './pages/inscriptions/eleve-dossier/eleve-dossier.component';
import { InscriptionSuiviComponent } from './pages/inscriptions/inscription-suivi/inscription-suivi.component';
import { PaiementSuiviComponent } from './pages/inscriptions/paiement-suivi/paiement-suivi.component';
import { StatistiquesDashboardComponent } from './pages/inscriptions/statistiques-dashboard/statistiques-dashboard.component';
import { EvaluationListComponent } from './pages/pedagogie/evaluation-list/evaluation-list.component';
import { SaisieNotesComponent } from './pages/pedagogie/saisie-notes/saisie-notes.component';
import { MoyennesConsultationComponent } from './pages/pedagogie/moyennes-consultation/moyennes-consultation.component';
import { DeliberationListComponent } from './pages/pedagogie/deliberation-list/deliberation-list.component';
import { DeliberationDetailComponent } from './pages/pedagogie/deliberation-detail/deliberation-detail.component';
import { StatistiquesClasseComponent } from './pages/pedagogie/statistiques-classe/statistiques-classe.component';
import { BulletinsParentComponent } from './pages/parents/bulletins-parent/bulletins-parent.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';
import { PaiementVerificationComponent } from './pages/public/paiement-verification/paiement-verification.component';
import { PermissionsComponent } from './pages/administration/permissions/permissions.component';

// Une route par référentiel du Module 01 (Établissements, Années scolaires, Niveaux, Classes,
// Matières, Salles, Utilisateurs, Profils), toutes servies par le même ReferentielPageComponent
// générique, configuré via route data - cf. REFERENTIEL_CRUD_ENTITIES.
const referentielRoutes: Routes = REFERENTIEL_CRUD_ENTITIES.map((entity) => ({
  path: `referentiels/${entity.key}`,
  component: ReferentielPageComponent,
  canActivate: [roleGuard],
  data: {
    entity,
    permission: entity.key === 'utilisateurs'
      ? 'UTILISATEUR_GERER'
      : entity.key === 'profils'
        ? 'PERMISSION_GERER'
        : 'REFERENTIEL_GERER'
  },
  title: `${entity.label} | SGS`
}));

export const routes: Routes = [
  {
    path: 'verification-paiement/:code',
    component: PaiementVerificationComponent,
    title: 'Vérification du reçu | SGS'
  },
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Accueil | SGS',
      },
      {
        path:'emploi-du-temps',
        component:CalenderComponent,
        canActivate:[roleGuard],
        data:{permission:'EDT_CONSULTER'},
        title:'Emploi du temps | SGS'
      },
      {
        path:'personnel',
        component:PersonnelDashboardComponent,
        canActivate:[roleGuard],
        data:{permission:'PERSONNEL_CONSULTER'},
        title:'Personnel | SGS'
      },
      {path:'personnel/evaluations-detaillees',component:EvaluationsDetailleesComponent,canActivate:[roleGuard],data:{permission:'RH_EVALUATION_GERER'},title:'Évaluations détaillées | SGS'},
      {
        path:'portail',component:PortailComponent,canActivate:[roleGuard],
        data:{permission:'PORTAIL_FAMILLE'},title:'Portail Parents & Élèves | SGS'
      },
      {path:'mon-espace-personnel',component:MonEspacePersonnelComponent,canActivate:[roleGuard],data:{permission:'CONGE_PERSONNEL'},title:'Mes congés | SGS'},
      {
        path:'administration-portail',component:PortailAdministrationComponent,canActivate:[roleGuard],
        data:{permission:'PORTAIL_ADMINISTRER'},title:'Administration du portail | SGS'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Mon profil | SGS'
      },
      {
        path: 'parametres-compte',
        component: AccountSettingsComponent,
        title: 'Paramètres du compte | SGS'
      },
      {
        path: 'assistance',
        component: SupportComponent,
        title: 'Assistance | SGS'
      },
      {
        path: 'audit',
        component: AuditLogComponent,
        canActivate: [roleGuard],
        data: { permission: 'AUDIT_CONSULTER' },
        title: 'Journal d\'audit | SGS'
      },
      {
        path: 'administration/demandes-compte',
        component: AccountRequestsComponent,
        canActivate: [roleGuard],
        data: { permission: 'DEMANDE_COMPTE_GERER' },
        title: 'Demandes de compte | SGS'
      },
      {
        path: 'administration/permissions',
        component: PermissionsComponent,
        canActivate: [roleGuard],
        data: { permission: 'PERMISSION_GERER' },
        title: 'Profils et permissions | SGS'
      },
      // Module Inscription des Élèves : ouvert à SEC (secrétariat) en plus de SADM/ADM,
      // cf. @PreAuthorize côté service-inscription (EleveController/PieceJustificativeController/
      // ParentTuteurController class-level, hasAnyAuthority('SEC','SADM','ADM')).
      {
        path: 'inscriptions/eleves',
        component: EleveListComponent,
        canActivate: [roleGuard],
        data: { permission: 'INSCRIPTION_ELEVE_GERER' },
        title: 'Élèves | SGS'
      },
      {
        path: 'inscriptions/eleves/:uuid',
        component: EleveDossierComponent,
        canActivate: [roleGuard],
        data: { permission: 'INSCRIPTION_ELEVE_GERER' },
        title: 'Dossier élève | SGS'
      },
      {
        path: 'inscriptions/suivi',
        component: InscriptionSuiviComponent,
        canActivate: [roleGuard],
        data: { permission: 'INSCRIPTION_GERER' },
        title: 'Suivi des inscriptions | SGS'
      },
      {
        path: 'inscriptions/paiements',
        component: PaiementSuiviComponent,
        canActivate: [roleGuard],
        data: { permission: 'PAIEMENT_GERER' },
        title: 'Suivi des paiements | SGS'
      },
      {
        path: 'inscriptions/statistiques',
        component: StatistiquesDashboardComponent,
        canActivate: [roleGuard],
        data: { permission: 'INSCRIPTION_STATISTIQUE' },
        title: 'Statistiques d\'inscription | SGS'
      },
      // Module Pédagogie — Notes & Moyennes : ouvert à ENS (enseignant) en plus de SADM/ADM,
      // cf. @PreAuthorize côté service-pedagogie (EvaluationController/NoteController class-level,
      // hasAnyAuthority('ENS','SADM','ADM')).
      {
        path: 'pedagogie/evaluations',
        component: EvaluationListComponent,
        canActivate: [roleGuard],
        data: { permission: 'EVALUATION_GERER' },
        title: 'Évaluations | SGS'
      },
      {
        path: 'pedagogie/evaluations/:uuid/notes',
        component: SaisieNotesComponent,
        canActivate: [roleGuard],
        data: { permission: 'NOTE_GERER' },
        title: 'Saisie des notes | SGS'
      },
      // Consultation interne des moyennes. Le portail PAR/ELV (phase 4) utilisera des endpoints
      // dédiés avec contrôle d'appartenance parent/enfant ; ne jamais exposer cette vue de classe
      // aux comptes portail avant ce contrôle backend.
      {
        path: 'pedagogie/moyennes',
        component: MoyennesConsultationComponent,
        canActivate: [roleGuard],
        data: { permission: 'MOYENNE_CONSULTER' },
        title: 'Notes et moyennes | SGS'
      },
      {
        path: 'pedagogie/statistiques',
        component: StatistiquesClasseComponent,
        canActivate: [roleGuard],
        data: { permission: 'PEDAGOGIE_STATISTIQUE' },
        title: 'Statistiques de classe | SGS'
      },
      // Délibérations : SADM/ADM uniquement, cf. DeliberationController class-level @PreAuthorize.
      {
        path: 'pedagogie/deliberations',
        component: DeliberationListComponent,
        canActivate: [roleGuard],
        data: { permission: 'DELIBERATION_GERER' },
        title: 'Délibérations | SGS'
      },
      {
        path: 'pedagogie/deliberations/:uuid',
        component: DeliberationDetailComponent,
        canActivate: [roleGuard],
        data: { permission: 'DELIBERATION_GERER' },
        title: 'Session de délibération | SGS'
      },
      {
        path: 'parents/bulletins',
        component: BulletinsParentComponent,
        canActivate: [roleGuard],
        data: { permission: 'BULLETIN_TELECHARGER' },
        title: 'Bulletins | SGS'
      },
      ...referentielRoutes,
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    canActivate: [guestGuard],
    title:'Connexion | SGS'
  },
  {
    path:'demande-compte',
    component:AccountRequestComponent,
    canActivate: [guestGuard],
    title:'Demande de compte | SGS'
  },
  {
    path:'reset-password',
    component:ResetPasswordComponent,
    canActivate: [guestGuard],
    title:'Réinitialisation du mot de passe | SGS'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Page introuvable | SGS'
  },
];
