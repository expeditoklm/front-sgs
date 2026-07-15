export type JourSemaine = 'MONDAY'|'TUESDAY'|'WEDNESDAY'|'THURSDAY'|'FRIDAY'|'SATURDAY';
export interface CoursPlanifie { uuid:string; code:string; anneeScolaireId:number; classeId:number; classe:string; matiereId:number; matiere:string; enseignantId:number; enseignant:string; salleId:number; salle:string; plageId?:number;plage?:string;jour:JourSemaine; heureDebut:string; heureFin:string; dateException?:string; statut:'BROUILLON'|'PUBLIE'|'REMPLACEMENT'; couleur:string; notes?:string; }
export interface CoursPayload { anneeScolaireId:number; classeId:number; matiereId:number; enseignantId:number; salleId:number;plageId?:number|null;jour:JourSemaine; heureDebut:string; heureFin:string; dateException?:string|null; couleur:string; notes?:string; }
export interface OptionRef { id:number; label:string; }
export interface EmploiDuTempsOptions { annees:OptionRef[];classes:OptionRef[];matieres:OptionRef[];enseignants:OptionRef[];salles:OptionRef[];cours:CoursPlanifie[]; }
export interface DisponibiliteEnseignant { uu_id:string;dis_enseignant_id:number;enseignant:string;dis_jour:JourSemaine;dis_debut:string;dis_fin:string;dis_disponible:boolean;dis_motif?:string; }
export interface DisponibilitePayload { enseignantId:number;jour:JourSemaine;heureDebut:string;heureFin:string;disponible:boolean;motif?:string; }
export interface Remplacement { uu_id:string;cours_uuid:string;edt_code:string;rem_date:string;rem_motif?:string;rem_statut:'PLANIFIE'|'EFFECTUE'|'ANNULE';enseignant_initial:string;enseignant_remplacant:string; }
export interface RemplacementPayload { enseignantRemplacantId:number;date:string;motif?:string; }
export interface AbsenceCours { uu_id:string;cours_uuid:string;edt_code:string;abs_date:string;abs_type:'ELEVE'|'ENSEIGNANT';abs_personne_id?:number;abs_nom_personne:string;abs_justifiee:boolean;abs_motif?:string;abs_notification_envoyee:boolean; }
export interface AbsencePayload { date:string;type:'ELEVE'|'ENSEIGNANT';personneId?:number;nomPersonne:string;justifiee:boolean;motif?:string; }
export interface EleveCoursOption { id:number;uuid:string;label:string; }
export interface SuggestionConflit { type:'SALLE'|'HORAIRE';libelle:string;enseignantId:number;salleId:number;jour:JourSemaine;heureDebut:string;heureFin:string; }
export interface StatutPublication { publie:boolean;publicationActive?:Record<string,unknown>;historique:Record<string,unknown>[]; }
export interface PlageHoraire { id:number;uu_id:string;pla_code:string;pla_libelle:string;pla_debut:string;pla_fin:string;pla_ordre:number;pla_active:boolean; }
export interface IndisponibiliteSalle { uu_id:string;ids_salle_id:number;salle:string;ids_jour?:JourSemaine;ids_date_debut?:string;ids_date_fin?:string;ids_debut:string;ids_fin:string;ids_motif?:string; }
