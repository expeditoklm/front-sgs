import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { GlobalSearchService } from '../../../core/services/global-search.service';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';
import { SidebarService } from '../../services/sidebar.service';

type CommandCategory = 'Actions rapides' | 'Élèves' | 'Personnel' | 'Référentiels' | 'Pages';

interface CommandItem {
  label: string;
  description: string;
  category: CommandCategory;
  route: string;
  permission?: string;
  keywords?: string;
  details?: string[];
  actions?: Array<{ label: string; route: string }>;
  recent?: boolean;
}

const COMMANDS: CommandItem[] = [
  { label: 'Accueil', description: 'Tableau de bord SGS', category: 'Pages', route: '/', keywords: 'dashboard statistiques' },
  { label: 'Emploi du temps', description: 'Planifier et consulter les cours', category: 'Pages', route: '/emploi-du-temps', permission: 'EDT_CONSULTER', keywords: 'cours calendrier salle enseignant' },
  { label: 'Créer un cours', description: "Ouvrir la planification de l'emploi du temps", category: 'Actions rapides', route: '/emploi-du-temps', permission: 'EDT_GERER', keywords: 'nouveau planifier calendrier' },
  { label: 'Personnel', description: 'Consulter le personnel', category: 'Pages', route: '/personnel', permission: 'PERSONNEL_CONSULTER', keywords: 'employé enseignant rh' },
  { label: 'Élèves', description: 'Rechercher et gérer les dossiers élèves', category: 'Pages', route: '/inscriptions/eleves', permission: 'INSCRIPTION_ELEVE_GERER', keywords: 'inscription dossier matricule' },
  { label: 'Inscrire un élève', description: 'Ouvrir la gestion des élèves', category: 'Actions rapides', route: '/inscriptions/eleves', permission: 'INSCRIPTION_ELEVE_GERER', keywords: 'nouveau nouvelle créer inscription' },
  { label: 'Suivi des inscriptions', description: 'Valider et suivre les inscriptions', category: 'Pages', route: '/inscriptions/suivi', permission: 'INSCRIPTION_GERER', keywords: 'validation classe' },
  { label: 'Enregistrer un paiement', description: 'Rechercher un élève puis enregistrer son versement', category: 'Actions rapides', route: '/inscriptions/eleves', permission: 'PAIEMENT_GERER', keywords: 'nouveau payer reçu caisse versement' },
  { label: 'Suivi des paiements', description: 'Rechercher un reçu ou consulter les versements', category: 'Pages', route: '/inscriptions/paiements', permission: 'PAIEMENT_GERER', keywords: 'reçu caisse versement' },
  { label: 'Statistiques des inscriptions', description: 'Consulter les indicateurs', category: 'Pages', route: '/inscriptions/statistiques', permission: 'INSCRIPTION_STATISTIQUE', keywords: 'dashboard effectif' },
  { label: 'Évaluations', description: 'Créer et gérer les évaluations', category: 'Pages', route: '/pedagogie/evaluations', permission: 'EVALUATION_GERER', keywords: 'devoir examen' },
  { label: 'Saisir les notes', description: 'Choisir une évaluation puis saisir les notes', category: 'Actions rapides', route: '/pedagogie/evaluations', permission: 'NOTE_GERER', keywords: 'note notation grille' },
  { label: 'Notes et moyennes', description: 'Consulter les résultats scolaires', category: 'Pages', route: '/pedagogie/moyennes', permission: 'MOYENNE_CONSULTER', keywords: 'bulletin résultat' },
  { label: 'Délibérations', description: 'Gérer les sessions de délibération', category: 'Pages', route: '/pedagogie/deliberations', permission: 'DELIBERATION_GERER', keywords: 'décision conseil classe' },
  { label: "Journal d'audit", description: 'Consulter les opérations réalisées', category: 'Pages', route: '/audit', permission: 'AUDIT_CONSULTER', keywords: 'historique modification traçabilité' },
  { label: 'Profils et permissions', description: 'Administrer les accès', category: 'Pages', route: '/administration/permissions', permission: 'PERMISSION_GERER', keywords: 'rôle droit sécurité' },
  { label: 'Paramètres du compte', description: 'Modifier mes préférences', category: 'Pages', route: '/parametres-compte', keywords: 'profil mot de passe' }
];

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    UserDropdownComponent
  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent {
  isApplicationMenuOpen = false;
  readonly isMobileOpen$;
  query = '';
  paletteOpen = false;
  searching = false;
  commandResults: CommandItem[] = [];
  studentResults: CommandItem[] = [];
  personnelResults: CommandItem[] = [];
  referenceResults: CommandItem[] = [];
  recentResults: CommandItem[] = [];
  private readonly searchTerms = new Subject<string>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private authService: AuthenticationService,
    private globalSearchService: GlobalSearchService
  ) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.refreshCommands();
    this.loadRecentPages();

    this.searchTerms.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term.trim().length < 2) {
          return of({ students: [], personnel: [], references: [] });
        }
        this.searching = true;
        return this.globalSearchService.search(term.trim()).pipe(
          catchError(() => of({ students: [], personnel: [], references: [] }))
        );
      })
    ).subscribe((results) => {
      this.studentResults = results.students.map((student) => ({
        label: student.nomComplet,
        description: `Élève · ${student.matricule}`,
        category: 'Élèves',
        route: `/inscriptions/eleves/${student.eleveUuid}`,
        details: [
          student.inscriptionCode ? `Inscription : ${student.inscriptionCode}` : 'Aucune inscription',
          student.classe ? `Classe : ${student.classe}` : '',
          student.telephone ? `Téléphone : ${student.telephone}` : '',
          student.soldeRestant !== null ? `Solde restant : ${this.money(student.soldeRestant)}` : '',
          student.dernierNumeroRecu ? `Dernier reçu : ${student.dernierNumeroRecu}` : ''
        ].filter(Boolean),
        actions: [
          { label: 'Voir le dossier', route: `/inscriptions/eleves/${student.eleveUuid}` },
          ...(student.inscriptionUuid && this.authService.hasPermission('PAIEMENT_GERER')
            ? [{ label: 'Enregistrer un paiement', route: `/inscriptions/eleves/${student.eleveUuid}?action=paiement` }]
            : []),
          ...(student.dernierNumeroRecu
            ? [{ label: 'Voir les reçus', route: `/inscriptions/eleves/${student.eleveUuid}?section=paiements` }]
            : [])
        ]
      }));
      this.personnelResults = results.personnel.map((person) => ({
        label: `${person.prenom} ${person.nom}`,
        description: `${person.matricule} · ${person.categorie}`,
        category: 'Personnel',
        route: '/personnel',
        details: [person.telephone ?? '', person.email, person.specialite ?? ''].filter(Boolean)
      }));
      this.referenceResults = results.references.map((reference) => ({
        label: reference.label,
        description: `${reference.type}${reference.code ? ` · ${reference.code}` : ''}`,
        category: 'Référentiels',
        route: reference.route
      }));
      this.searching = false;
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.rememberPage(event.urlAfterRedirects.split('?')[0]);
    });
  }

  get results(): CommandItem[] {
    return [
      ...this.commandResults,
      ...(!this.query.trim() ? this.recentResults : []),
      ...this.studentResults,
      ...this.personnelResults,
      ...this.referenceResults
    ];
  }

  get categories(): CommandCategory[] {
    const order: CommandCategory[] = ['Actions rapides', 'Élèves', 'Personnel', 'Référentiels', 'Pages'];
    return order.filter((category) => this.results.some((item) => item.category === category));
  }

  resultsFor(category: CommandCategory): CommandItem[] {
    return this.results.filter((item) => item.category === category);
  }

  handleToggle(): void {
    if (window.innerWidth >= 1280) this.sidebarService.toggleExpanded();
    else this.sidebarService.toggleMobileOpen();
  }

  toggleApplicationMenu(): void {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  openPalette(): void {
    this.paletteOpen = true;
    this.refreshCommands();
  }

  closePalette(): void {
    this.paletteOpen = false;
  }

  onSearch(term: string): void {
    this.query = term;
    this.paletteOpen = true;
    this.refreshCommands();
    if (term.trim().length < 2) this.clearBusinessResults();
    this.searchTerms.next(term);
  }

  submitSearch(): void {
    if (this.results.length) this.select(this.results[0]);
  }

  select(item: CommandItem): void {
    this.navigate(item.route);
  }

  navigate(route: string): void {
    this.closePalette();
    this.query = '';
    this.clearBusinessResults();
    this.router.navigateByUrl(route);
  }

  ngAfterViewInit(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.searchTerms.complete();
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openPalette();
      setTimeout(() => this.searchInput?.nativeElement.focus());
    } else if (event.key === 'Escape' && this.paletteOpen) {
      this.closePalette();
      this.searchInput?.nativeElement.blur();
    }
  };

  private refreshCommands(): void {
    const term = this.normalize(this.query);
    this.commandResults = COMMANDS
      .filter((item) => !item.permission || this.authService.hasPermission(item.permission))
      .filter((item) => !term || this.normalize(`${item.label} ${item.description} ${item.keywords ?? ''}`).includes(term))
      .slice(0, 10);
  }

  private clearBusinessResults(): void {
    this.studentResults = [];
    this.personnelResults = [];
    this.referenceResults = [];
    this.searching = false;
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  private money(value: number): string {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} FCFA`;
  }

  private loadRecentPages(): void {
    try {
      const routes = JSON.parse(localStorage.getItem('sgs-recent-pages') ?? '[]') as string[];
      this.recentResults = routes
        .map((route) => COMMANDS.find((command) => command.category === 'Pages' && command.route === route))
        .filter((item): item is CommandItem => !!item)
        .filter((item) => !item.permission || this.authService.hasPermission(item.permission))
        .map((item) => ({ ...item, recent: true, description: `Récemment visitée · ${item.description}` }));
    } catch {
      this.recentResults = [];
    }
  }

  private rememberPage(route: string): void {
    if (!COMMANDS.some((command) => command.category === 'Pages' && command.route === route)) return;
    const current = this.recentResults.map((item) => item.route).filter((item) => item !== route);
    localStorage.setItem('sgs-recent-pages', JSON.stringify([route, ...current].slice(0, 5)));
    this.loadRecentPages();
  }
}
