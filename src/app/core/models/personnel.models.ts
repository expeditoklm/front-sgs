export interface Employe { uuid:string;matricule:string;nom:string;prenom:string;email:string;telephone?:string;categorie:string;specialite?:string;dateEmbauche:string;actif:boolean;utilisateurId?:number|null;utilisateur?:string|null; }
export interface EmployePayload { nom:string;prenom:string;email:string;telephone:string;categorie:string;specialite:string;dateEmbauche:string;utilisateurId:number|null; }
export interface Conge { uu_id:string;employe_uuid:string;employe:string;cng_type:string;cng_date_debut:string;cng_date_fin:string;cng_motif?:string;cng_statut:string;cng_commentaire?:string; }
export interface Contrat { uu_id:string;employe_uuid:string;employe:string;con_type:string;con_date_debut:string;con_date_fin?:string;con_remuneration?:number;con_actif:boolean; }
export interface RhDashboard { effectif_actif:number;enseignants:number;contrats_actifs:number;conges_en_attente:number; }
export interface RhOption { id:number;label:string; }
export interface RhOptions { annees:RhOption[];matieres:RhOption[];niveaux:RhOption[];classes:RhOption[];utilisateurs:RhOption[]; }
export interface Affectation { uu_id:string;employe_uuid:string;employe:string;aff_annee_id:number;annee:string;matiere?:string;niveau?:string;classe?:string;aff_heures_hebdo:number;aff_date_debut:string;aff_date_fin?:string; }
export interface SoldeConge { uu_id:string;employe_uuid:string;employe:string;sol_annee:number;sol_type:string;sol_jours_acquis:number;sol_jours_reportes:number;jours_pris:number;solde:number; }
export interface EvaluationRh { uu_id:string;employe_uuid:string;employe:string;eva_date:string;eva_periode:string;eva_note:number;eva_objectifs?:string;eva_appreciation?:string;eva_evaluateur:string; }
export interface StatistiqueCategorieRh { categorie:string;effectif:number; }
export interface StatistiqueContratRh { type:string;nombre:number; }
export interface StatistiqueChargeRh { uu_id:string;enseignant:string;heures_hebdo:number;capacite_reference:number;taux_charge:number; }
export interface StatistiquePresenceRh {
  mois:string;
  jours_ouvrables:number;
  effectif_cible:number;
  journees_theoriques:number;
  jours_conges:number;
  absences_injustifiees:number;
  jours_absence:number;
  taux_presence:number;
}
export interface StatistiqueEvaluationRh { mois:string;moyenne:number;nombre:number; }
export interface StatistiquesRh {
  categories:StatistiqueCategorieRh[];
  contrats:StatistiqueContratRh[];
  chargeEnseignants:StatistiqueChargeRh[];
  presence:StatistiquePresenceRh[];
  evaluations:StatistiqueEvaluationRh[];
}
export interface CritereEvaluationConfig { id?:number;uuid?:string;code:string;libelle:string;coefficient:number;ordre:number; }
export interface GrilleEvaluationConfig { id:number;uuid:string;code:string;libelle:string;actif:boolean;criteres:CritereEvaluationConfig[]; }
export interface GrilleEvaluationPayload { code:string;libelle:string;criteres:CritereEvaluationConfig[]; }
