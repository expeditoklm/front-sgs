import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { AccountRequestComponent } from './pages/auth-pages/account-request/account-request.component';
import { ResetPasswordComponent } from './pages/auth-pages/reset-password/reset-password.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { PersonnelDashboardComponent } from './pages/personnel/personnel-dashboard.component';
import { PortailComponent } from './pages/portail/portail.component';
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
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

// Une route par référentiel du Module 01 (Établissements, Années scolaires, Niveaux, Classes,
// Matières, Salles, Utilisateurs, Profils), toutes servies par le même ReferentielPageComponent
// générique, configuré via route data - cf. REFERENTIEL_CRUD_ENTITIES.
const referentielRoutes: Routes = REFERENTIEL_CRUD_ENTITIES.map((entity) => ({
  path: `referentiels/${entity.key}`,
  component: ReferentielPageComponent,
  canActivate: [roleGuard],
  data: { entity, roles: entity.roles },
  title: `${entity.label} | SGS`
}));

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate: [authGuard],
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path:'emploi-du-temps',
        component:CalenderComponent,
        canActivate:[roleGuard],
        data:{roles:['SADM','ADM','ENS','SUR','SEC']},
        title:'Emploi du temps | SGS'
      },
      {
        path:'personnel',
        component:PersonnelDashboardComponent,
        canActivate:[roleGuard],
        data:{roles:['SADM','ADM']},
        title:'Personnel | SGS'
      },
      {
        path:'portail',component:PortailComponent,canActivate:[roleGuard],
        data:{roles:['PAR','ELV']},title:'Portail Parents & Élèves | SGS'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'audit',
        component: AuditLogComponent,
        canActivate: [roleGuard],
        data: { roles: ['SADM', 'ADM'] },
        title: 'Journal d\'audit | SGS'
      },
      // Module Inscription des Élèves : ouvert à SEC (secrétariat) en plus de SADM/ADM,
      // cf. @PreAuthorize côté service-inscription (EleveController/PieceJustificativeController/
      // ParentTuteurController class-level, hasAnyAuthority('SEC','SADM','ADM')).
      {
        path: 'inscriptions/eleves',
        component: EleveListComponent,
        canActivate: [roleGuard],
        data: { roles: ['SEC', 'SADM', 'ADM'] },
        title: 'Élèves | SGS'
      },
      {
        path: 'inscriptions/eleves/:uuid',
        component: EleveDossierComponent,
        canActivate: [roleGuard],
        data: { roles: ['SEC', 'SADM', 'ADM'] },
        title: 'Dossier élève | SGS'
      },
      {
        path: 'inscriptions/suivi',
        component: InscriptionSuiviComponent,
        canActivate: [roleGuard],
        data: { roles: ['SEC', 'SADM', 'ADM'] },
        title: 'Suivi des inscriptions | SGS'
      },
      {
        path: 'inscriptions/paiements',
        component: PaiementSuiviComponent,
        canActivate: [roleGuard],
        data: { roles: ['SEC', 'SADM', 'ADM'] },
        title: 'Suivi des paiements | SGS'
      },
      {
        path: 'inscriptions/statistiques',
        component: StatistiquesDashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['SEC', 'SADM', 'ADM'] },
        title: 'Statistiques d\'inscription | SGS'
      },
      // Module Pédagogie — Notes & Moyennes : ouvert à ENS (enseignant) en plus de SADM/ADM,
      // cf. @PreAuthorize côté service-pedagogie (EvaluationController/NoteController class-level,
      // hasAnyAuthority('ENS','SADM','ADM')).
      {
        path: 'pedagogie/evaluations',
        component: EvaluationListComponent,
        canActivate: [roleGuard],
        data: { roles: ['ENS', 'SADM', 'ADM'] },
        title: 'Évaluations | SGS'
      },
      {
        path: 'pedagogie/evaluations/:uuid/notes',
        component: SaisieNotesComponent,
        canActivate: [roleGuard],
        data: { roles: ['ENS', 'SADM', 'ADM'] },
        title: 'Saisie des notes | SGS'
      },
      // Consultation interne des moyennes. Le portail PAR/ELV (phase 4) utilisera des endpoints
      // dédiés avec contrôle d'appartenance parent/enfant ; ne jamais exposer cette vue de classe
      // aux comptes portail avant ce contrôle backend.
      {
        path: 'pedagogie/moyennes',
        component: MoyennesConsultationComponent,
        canActivate: [roleGuard],
        data: { roles: ['ENS', 'SEC', 'SADM', 'ADM'] },
        title: 'Notes et moyennes | SGS'
      },
      {
        path: 'pedagogie/statistiques',
        component: StatistiquesClasseComponent,
        canActivate: [roleGuard],
        data: { roles: ['ENS', 'SEC', 'SADM', 'ADM'] },
        title: 'Statistiques de classe | SGS'
      },
      // Délibérations : SADM/ADM uniquement, cf. DeliberationController class-level @PreAuthorize.
      {
        path: 'pedagogie/deliberations',
        component: DeliberationListComponent,
        canActivate: [roleGuard],
        data: { roles: ['SADM', 'ADM'] },
        title: 'Délibérations | SGS'
      },
      {
        path: 'pedagogie/deliberations/:uuid',
        component: DeliberationDetailComponent,
        canActivate: [roleGuard],
        data: { roles: ['SADM', 'ADM'] },
        title: 'Session de délibération | SGS'
      },
      ...referentielRoutes,
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    canActivate: [guestGuard],
    title:'Angular Sign In Dashboard | TailAdmin - Angular Admin Dashboard Template'
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
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
