// Module "Pédagogie — Notes & Moyennes" - modèles alignés sur les DTOs de service-pedagogie
// (bj.sgs.pedagogie.dto.*). Pas de couplage aux référentiels (Classe, Matière, Période, Année
// scolaire) au-delà d'un id "à plat" (classeId, matiereId...), même choix que côté backend.

export type TypeEvaluation = string;

export const TYPE_EVALUATION_LABELS: Record<TypeEvaluation, string> = {
  DEVOIR: 'Devoir',
  COMPOSITION: 'Composition',
  INTERROGATION: 'Interrogation'
};

// BROUILLON -> PUBLIEE seulement (cf. EvaluationService.publier côté backend) - jamais l'inverse.
export type StatutEvaluation = 'BROUILLON' | 'PUBLIEE';

export const STATUT_EVALUATION_LABELS: Record<StatutEvaluation, string> = {
  BROUILLON: 'Brouillon',
  PUBLIEE: 'Publiée'
};

export interface Evaluation {
  id: number;
  uuid: string;
  code: string;
  classeId: number;
  matiereId: number;
  periodeId: number;
  anneeScolaireId: number;
  enseignantId: number | null;
  type: TypeEvaluation;
  libelle: string;
  date: string;
  coefficient: number;
  bareme: number;
  statut: StatutEvaluation;
}

export interface EvaluationRequest {
  classeId: number;
  matiereId: number;
  periodeId: number;
  anneeScolaireId: number;
  type: TypeEvaluation;
  libelle: string;
  date: string;
  coefficient: number;
  bareme: number;
}

export interface Note {
  id: number;
  uuid: string;
  code: string;
  evaluationUuid: string;
  inscriptionId: number;
  valeur: number | null;
  absent: boolean;
  appreciation: string | null;
}

// Une ligne de la grille de saisie (un élève) - cf. NoteLotRequest côté backend.
export interface NoteLotItem {
  inscriptionUuid: string;
  valeur: number | null;
  absent: boolean;
  appreciation: string | null;
}

export interface NoteLotRequest {
  evaluationUuid: string;
  notes: NoteLotItem[];
}

export interface NoteLotErreur {
  inscriptionUuid: string;
  message: string;
}

export interface NoteLotResponse {
  evaluationUuid: string;
  total: number;
  enregistrees: number;
  notes: Note[];
  erreurs: NoteLotErreur[];
}

// --- Moyennes (lecture seule - jamais de création/modification, cf. MoyenneCalculationService) --

export interface MoyenneMatiere {
  inscriptionId: number;
  matiereId: number;
  periodeId: number;
  valeur: number;
  rangMatiere: number | null;
}

export interface MoyenneGenerale {
  inscriptionId: number;
  periodeId: number;
  valeur: number;
  rangClasse: number | null;
}

export type DecisionDeliberation = string;

export const DECISION_DELIBERATION_LABELS: Record<DecisionDeliberation, string> = {
  PASSAGE: 'Passage',
  PASSAGE_CONDITIONNEL: 'Passage conditionnel',
  REDOUBLEMENT: 'Redoublement'
};

export type MentionDeliberation = string;

export const MENTION_DELIBERATION_LABELS: Record<MentionDeliberation, string> = {
  TABLEAU_HONNEUR: "Tableau d'honneur",
  ENCOURAGEMENTS: 'Encouragements',
  FELICITATIONS: 'Félicitations'
};

// Prévisualisation en lecture seule (pas de Deliberation ouverte) - cf. MoyenneCalculationService.getDecisionSuggeree.
export interface DecisionSuggeree {
  inscriptionId: number;
  periodeId: number | null;
  moyenneReference: number | null;
  finDAnnee: boolean;
  decisionSuggeree: DecisionDeliberation | null;
  mentionSuggeree: MentionDeliberation | null;
}

// Statistiques agrégées d'une classe pour une période (tableau de bord) - réussite = moyenne
// >= 10/20, cf. MoyenneCalculationService.getStatistiquesClasse côté backend. Les agrégats sont
// null quand aucune moyenne n'est encore calculée (effectif 0).
export interface StatistiqueClassePedagogie {
  classeId: number;
  periodeId: number;
  effectif: number;
  noteMin: number | null;
  noteMax: number | null;
  moyenne: number | null;
  tauxReussite: number | null;
}

export interface StatistiqueMatierePedagogie {
  matiereId: number;
  effectif: number;
  noteMin: number | null;
  noteMax: number | null;
  moyenne: number | null;
  tauxReussite: number | null;
}

// --- Délibération -----------------------------------------------------------

// PLANIFIEE -> EN_COURS -> CLOTUREE seulement (cf. DeliberationWorkflowService.TRANSITIONS_AUTORISEES
// côté backend) - jamais l'inverse, une clôture est définitive.
export type StatutDeliberation = 'PLANIFIEE' | 'EN_COURS' | 'CLOTUREE';

export const STATUT_DELIBERATION_LABELS: Record<StatutDeliberation, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  CLOTUREE: 'Clôturée'
};

export interface Deliberation {
  id: number;
  uuid: string;
  code: string;
  classeId: number;
  // null = délibération de fin d'année (décision passage/redoublement) - cf. Deliberation.isFinDAnnee.
  periodeId: number | null;
  presidentId: number | null;
  date: string;
  statut: StatutDeliberation;
}

export interface DeliberationRequest {
  classeId: number;
  periodeId: number | null;
  presidentId: number | null;
}

export interface DeliberationDecision {
  id: number;
  uuid: string;
  inscriptionId: number;
  moyenneGenerale: number | null;
  rangClasse: number | null;
  decisionSuggeree: DecisionDeliberation | null;
  decision: DecisionDeliberation | null;
  mention: MentionDeliberation | null;
  observation: string | null;
  moyenneAjustee: number | null;
  motifAjustement: string | null;
  moyenneEffective: number | null;
}

// Confirmation/override par le jury d'une décision déjà pré-remplie avec une suggestion
// automatique - "decision" n'est obligatoire côté backend que pour une délibération de fin
// d'année (cf. Deliberation.isFinDAnnee), et "motifAjustement" devient obligatoire dès que
// "moyenneAjustee" est renseigné (validé en service, pas exprimable en Bean Validation simple).
export interface DeliberationDecisionRequest {
  decision: DecisionDeliberation | null;
  mention: MentionDeliberation | null;
  observation: string | null;
  moyenneAjustee: number | null;
  motifAjustement: string | null;
}
