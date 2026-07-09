// Module "Inscription des Élèves" - modèles alignés sur les DTOs de service-inscription
// (bj.sgs.inscription.dto.*). Pas de couplage aux référentiels (Classe, Établissement, ...) au-delà
// d'un id "à plat" (classeId, etablissementId) - même choix que côté backend (cf.
// MODULE_INSCRIPTION_ELEVES.md section 1).

export type Sexe = 'M' | 'F';

export interface Eleve {
  id: number;
  uuid: string;
  code: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string | null;
  sexe: Sexe;
  photoFichierId: number | null;
  etablissementId: number;
  actif: boolean;
}

export interface EleveRequest {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string | null;
  sexe: Sexe;
  photoFichierId?: number | null;
  etablissementId?: number;
}

export type TypeInscription = 'PREMIERE_INSCRIPTION' | 'REDOUBLEMENT' | 'TRANSFERT';

export const TYPE_INSCRIPTION_LABELS: Record<TypeInscription, string> = {
  PREMIERE_INSCRIPTION: 'Première inscription',
  REDOUBLEMENT: 'Redoublement',
  TRANSFERT: "Transfert d'un autre établissement"
};

export type StatutInscription = 'NOUVELLE' | 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE' | 'ANNULEE';

export const STATUT_INSCRIPTION_LABELS: Record<StatutInscription, string> = {
  NOUVELLE: 'Nouvelle',
  EN_ATTENTE: "En attente d'approbation",
  VALIDEE: 'Validée',
  REJETEE: 'Rejetée',
  ANNULEE: 'Annulée'
};

export interface Inscription {
  id: number;
  uuid: string;
  code: string;
  eleveId: number;
  eleveUuid: string;
  eleveNomComplet: string;
  classeId: number;
  anneeScolaireId: number;
  type: TypeInscription;
  statut: StatutInscription;
  version: number;
  dateInscription: string;
  montantDu: number;
}

export interface InscriptionRequest {
  eleveUuid: string;
  classeId: number;
  anneeScolaireId: number;
  type: TypeInscription;
  montantDu: number;
}

export interface ParentTuteur {
  id: number;
  uuid: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  profession: string | null;
  adresse: string | null;
  utilisateurId: number | null;
}

export interface ParentTuteurRequest {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  profession?: string | null;
  adresse?: string | null;
}

export type TypeRelation = 'PERE' | 'MERE' | 'TUTEUR_LEGAL' | 'AUTRE';

export const TYPE_RELATION_LABELS: Record<TypeRelation, string> = {
  PERE: 'Père',
  MERE: 'Mère',
  TUTEUR_LEGAL: 'Tuteur légal',
  AUTRE: 'Autre'
};

export interface EleveParent {
  parentTuteurId: number;
  parentTuteurUuid: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  typeRelation: TypeRelation;
  contactPrincipal: boolean;
}

export interface EleveParentRequest {
  parentTuteurUuid: string;
  typeRelation: TypeRelation;
  contactPrincipal: boolean;
}

export type TypeDocument = 'ACTE_NAISSANCE' | 'CERTIFICAT_SCOLARITE' | 'PHOTO' | 'CNI_PARENT' | 'AUTRE';

export const TYPE_DOCUMENT_LABELS: Record<TypeDocument, string> = {
  ACTE_NAISSANCE: 'Acte de naissance',
  CERTIFICAT_SCOLARITE: 'Certificat de scolarité',
  PHOTO: 'Photo',
  CNI_PARENT: "CNI d'un parent",
  AUTRE: 'Autre'
};

export type StatutValidationPiece = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export const STATUT_VALIDATION_PIECE_LABELS: Record<StatutValidationPiece, string> = {
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validée',
  REJETE: 'Rejetée'
};

export interface PieceJustificative {
  id: number;
  uuid: string;
  inscriptionId: number;
  inscriptionUuid: string;
  type: TypeDocument;
  fichierId: number;
  statutValidation: StatutValidationPiece;
  commentaireRejet: string | null;
}

export interface PieceJustificativeRequest {
  inscriptionUuid: string;
  type: TypeDocument;
  fichierId: number;
}

export type ModePaiement = 'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT' | 'CHEQUE';

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile money',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque'
};

export type StatutPaiement = 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'REMBOURSE';

export const STATUT_PAIEMENT_LABELS: Record<StatutPaiement, string> = {
  EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé',
  ECHOUE: 'Échoué',
  REMBOURSE: 'Remboursé'
};

export interface Paiement {
  id: number;
  uuid: string;
  code: string | null;
  inscriptionId: number;
  inscriptionUuid: string;
  eleveUuid: string;
  eleveNomComplet: string;
  montant: number;
  mode: ModePaiement;
  referenceExterne: string | null;
  statut: StatutPaiement;
  datePaiement: string;
  numeroRecu: string | null;
  codeVerification: string | null;
}

export interface PaiementRequest {
  inscriptionUuid: string;
  montant: number;
  mode: ModePaiement;
  referenceExterne?: string | null;
}

// Filtre générique du CRUD backend (cf. bj.sgs.core.specs.FilterCriteria/FilterSpecification) -
// "field" accepte un chemin pointé pour les relations (ex. "eleve.nom", "inscription.eleve.nom").
export type FilterCondition = 'eq' | 'neq' | 'contains' | 'start' | 'ends' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';

export interface FilterCriteria {
  field: string;
  condition: FilterCondition;
  value: unknown;
}

// Réponse brute de POST /storage/upload (service-referentiel) - PAS enveloppée dans ApiResponse,
// contrairement à tous les autres endpoints (cf. StorageController.uploadFile, qui répond
// directement le UploadResponse). Le champ "download" contient en réalité l'uuid du fichier
// (nommage trompeur côté backend, UploadResponse(id, fileName, uuid, size) construit avec les
// noms de composants (id, fileName, download, fileSize) - non corrigé ici, hors périmètre).
export interface UploadResponse {
  id: number;
  fileName: string;
  download: string;
  fileSize: number;
}
