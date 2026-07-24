export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface MetaResponse {
  totalPages: number;
  numberOfElements: number;
  totalElements: number;
  size: number;
  pageNumber: number;
  hasPrev: boolean;
  hasNext: boolean;
  isLast: boolean;
  isFirst: boolean;
}

export interface PageResponse<T> {
  content: T[];
  meta: MetaResponse | null;
}

export type ReferentielRecord = Record<string, unknown> & { id: number; uuid: string };

export type AuditActionType = 'ADD' | 'MOD' | 'DEL';

export interface AuditRevision {
  revision: number;
  date: string;
  actionType: AuditActionType;
  operateurId: string | null;
  operateurNom: string | null;
  operateurEmail: string | null;
  operateurProfil: string | null;
  data: Record<string, unknown> | null;
}

export interface AuditEntityDescriptor {
  key: string;
  label: string;
  path: string;
}

export interface AuditModuleDescriptor {
  key: string;
  label: string;
  basePath: string;
  entities: AuditEntityDescriptor[];
}

// Filtres de consultation du journal d'audit : dates au
// format ISO (yyyy-MM-dd, valeur brute d'un <input type="date">), opérateur en recherche
// partielle, type d'action optionnel (vide = tous).
export interface AuditLogFilters {
  dateFrom: string;
  dateTo: string;
  operateur: string;
  actionType: AuditActionType | '';
}

export function emptyAuditLogFilters(): AuditLogFilters {
  return { dateFrom: '', dateTo: '', operateur: '', actionType: '' };
}

// Les 9 entités du Module 01 + Constante (paramétrage système) : toutes @Audited côté backend,
// donc toutes exposées par le même endpoint générique GET /referentiels/{path}/{id}/history.
export const REFERENTIEL_ENTITIES: AuditEntityDescriptor[] = [
  { key: 'parametres-metier', label: 'Paramètres métier', path: 'parametres-metier' },
  { key: 'etablissements', label: 'Établissements', path: 'etablissements' },
  { key: 'annees-scolaires', label: 'Années scolaires', path: 'annees-scolaires' },
  { key: 'niveaux', label: 'Niveaux', path: 'niveaux' },
  { key: 'classes', label: 'Classes', path: 'classes' },
  { key: 'matieres', label: 'Matières', path: 'matieres' },
  { key: 'salles', label: 'Salles', path: 'salles' },
  { key: 'utilisateurs', label: 'Utilisateurs', path: 'utilisateurs' },
  { key: 'profils', label: 'Profils', path: 'profils' },
  { key: 'droits', label: 'Droits', path: 'droits' },
  { key: 'constantes', label: 'Paramètres système (constantes)', path: 'constantes' }
];

export const INSCRIPTION_ENTITIES: AuditEntityDescriptor[] = [
  { key: 'eleves', label: 'Élèves', path: 'eleves' },
  { key: 'inscriptions', label: 'Inscriptions', path: 'inscriptions' },
  { key: 'paiements', label: 'Paiements', path: 'paiements' },
  { key: 'parents-tuteurs', label: 'Parents et tuteurs', path: 'parents-tuteurs' },
  { key: 'pieces-justificatives', label: 'Pièces justificatives', path: 'pieces-justificatives' }
];

export const PEDAGOGIE_ENTITIES: AuditEntityDescriptor[] = [
  { key: 'affectations', label: 'Affectations pédagogiques', path: 'affectations' },
  { key: 'evaluations', label: 'Évaluations', path: 'evaluations' },
  { key: 'notes', label: 'Notes', path: 'notes' },
  { key: 'deliberations', label: 'Délibérations', path: 'deliberations' }
];

export const AUDIT_MODULES: AuditModuleDescriptor[] = [
  {
    key: 'referentiels',
    label: 'Référentiels',
    basePath: 'referentiels',
    entities: REFERENTIEL_ENTITIES
  },
  {
    key: 'inscriptions',
    label: 'Inscriptions et paiements',
    basePath: 'inscriptions',
    entities: INSCRIPTION_ENTITIES
  },
  {
    key: 'pedagogie',
    label: 'Pédagogie',
    basePath: 'pedagogie',
    entities: PEDAGOGIE_ENTITIES
  },
  {
    key: 'emplois-du-temps',
    label: 'Emploi du temps',
    basePath: 'emplois-du-temps',
    entities: [
      { key: 'cours', label: 'Cours planifiés', path: 'cours' }
    ]
  }
];

// Chaque DTO de réponse a une forme différente (libelle, nom, firstName/lastName, dates...) :
// plutôt que du mapping par entité, on devine le meilleur champ à afficher — cohérent avec
// l'approche générique du endpoint d'historique côté backend.
export function recordLabel(record: Record<string, any>): string {
  if (record['libelle']) return String(record['libelle']);
  if (record['nom']) return String(record['nom']);
  if (record['firstName'] || record['lastName']) {
    return `${record['firstName'] ?? ''} ${record['lastName'] ?? ''}`.trim();
  }
  if (record['dateDebut'] && record['dateFin']) {
    return `${record['dateDebut']} → ${record['dateFin']}`;
  }
  if (record['code']) return String(record['code']);
  return `#${record['id']}`;
}

export function humanizeKey(key: string): string {
  const labels: Record<string, string> = {
    anneeScolaire: 'Année scolaire',
    plageHoraire: 'Plage horaire',
    heureDebut: 'Heure de début',
    heureFin: 'Heure de fin',
    dateException: "Date d'exception"
  };
  if (labels[key]) return labels[key];
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.length ? JSON.stringify(value) : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') {
    const labels: Record<string, string> = {
      MONDAY: 'Lundi',
      TUESDAY: 'Mardi',
      WEDNESDAY: 'Mercredi',
      THURSDAY: 'Jeudi',
      FRIDAY: 'Vendredi',
      SATURDAY: 'Samedi',
      SUNDAY: 'Dimanche',
      BROUILLON: 'Brouillon',
      PUBLIE: 'Publié',
      ANNULE: 'Annulé'
    };
    if (labels[value]) return labels[value];
  }
  return String(value);
}
