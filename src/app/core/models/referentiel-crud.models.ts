export interface SelectOption {
  value: string;
  label: string;
}

export type FieldType = 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'multiselect';

export interface OptionsSource {
  path: string;
  valueField: string;
  labelField: string;
  businessParameterGroup?: string;
}

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  // Le code est presque toujours immuable après création (unicité vérifiée seulement à la
  // création côté backend, cf. @ValueAlreadyExists(groups = CreateResource.class)).
  readOnlyOnEdit?: boolean;
  staticOptions?: SelectOption[];
  optionsSource?: OptionsSource;
}

export interface ColumnConfig {
  key: string;
  label: string;
}

export interface EntityDefinition {
  key: string;
  label: string;
  path: string;
  roles: string[];
  columns: ColumnConfig[];
  fields: FieldConfig[];
  hint?: string;
}

// Configuration des 8 référentiels du Module 01 gérés depuis l'UI. Chaque entrée pilote
// entièrement la page générique ReferentielPageComponent (colonnes du tableau, champs du
// formulaire, source des options des selects, rôles autorisés) - pas de composant dédié par
// entité, pour éviter 8 pages quasi identiques.
export const REFERENTIEL_CRUD_ENTITIES: EntityDefinition[] = [
  {
    key: 'parametres-metier',
    label: 'Paramètres métier',
    path: 'parametres-metier',
    roles: ['SADM', 'ADM'],
    hint: "Toutes les listes de valeurs utilisées par les formulaires sont visibles ici. Le groupe et le code sont stables ; le libellé, l'ordre, l'activation et les métadonnées sont configurables.",
    columns: [
      { key: 'groupe', label: 'Groupe' },
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'ordre', label: 'Ordre' },
      { key: 'actif', label: 'Actif' }
    ],
    fields: [
      { key: 'groupe', label: 'Groupe', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'ordre', label: "Ordre d'affichage", type: 'number', required: true },
      { key: 'actif', label: 'Actif', type: 'checkbox' },
      { key: 'metadonnees', label: 'Métadonnées JSON', type: 'text' }
    ]
  },
  {
    key: 'constantes',
    label: 'Paramètres système',
    path: 'constantes',
    roles: ['SADM'],
    hint: "Valeurs opérationnelles utilisées par les calculs et générations. Toute modification est auditée ; utilisez le format indiqué dans la description.",
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'valeur', label: 'Valeur' },
      { key: 'source', label: 'Module' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      { key: 'valeur', label: 'Valeur', type: 'text', required: true },
      { key: 'source', label: 'Module', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' }
    ]
  },
  {
    key: 'etablissements',
    label: 'Établissements',
    path: 'etablissements',
    roles: ['SADM', 'ADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'nom', label: 'Nom' },
      { key: 'typeEtablissement', label: 'Type' },
      { key: 'telephone', label: 'Téléphone' },
      { key: 'email', label: 'Email' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'nom', label: 'Nom', type: 'text', required: true },
      { key: 'adresse', label: 'Adresse', type: 'text' },
      { key: 'telephone', label: 'Téléphone', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      {
        key: 'typeEtablissement', label: "Type d'établissement", type: 'select', required: true,
        optionsSource: {
          path: 'parametres-metier-options',
          valueField: 'code',
          labelField: 'libelle',
          businessParameterGroup: 'TYPE_ETABLISSEMENT'
        }
      },
      { key: 'effectifCible', label: 'Effectif cible', type: 'number' },
      { key: 'logoUrl', label: 'URL du logo (en-tête des documents PDF)', type: 'text' }
    ]
  },
  {
    key: 'annees-scolaires',
    label: 'Années scolaires',
    path: 'annees-scolaires',
    roles: ['SADM', 'ADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'dateDebut', label: 'Début' },
      { key: 'dateFin', label: 'Fin' },
      { key: 'active', label: 'Active' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'dateDebut', label: 'Date de début', type: 'date', required: true },
      { key: 'dateFin', label: 'Date de fin', type: 'date', required: true },
      { key: 'active', label: 'Active', type: 'checkbox' }
    ]
  },
  {
    key: 'niveaux',
    label: 'Niveaux',
    path: 'niveaux',
    roles: ['SADM', 'ADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'ordre', label: 'Ordre' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      { key: 'ordre', label: 'Ordre', type: 'number', required: true }
    ]
  },
  {
    key: 'classes',
    label: 'Classes',
    path: 'classes',
    roles: ['SADM', 'ADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'capaciteMax', label: 'Capacité max' },
      { key: 'niveauLibelle', label: 'Niveau' },
      { key: 'anneeScolaireCode', label: 'Année scolaire' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      { key: 'capaciteMax', label: 'Capacité max', type: 'number', required: true },
      {
        key: 'niveauCode', label: 'Niveau', type: 'select', required: true,
        optionsSource: { path: 'niveaux', valueField: 'code', labelField: 'libelle' }
      },
      {
        key: 'anneeScolaireCode', label: 'Année scolaire', type: 'select', required: true,
        optionsSource: { path: 'annees-scolaires', valueField: 'code', labelField: 'code' }
      }
    ]
  },
  {
    key: 'matieres',
    label: 'Matières',
    path: 'matieres',
    roles: ['SADM', 'ADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'coefficient', label: 'Coefficient' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      { key: 'coefficient', label: 'Coefficient', type: 'number', required: true }
    ]
  },
  {
    key: 'periodes',
    label: 'Périodes',
    path: 'periodes',
    roles: ['SADM', 'ADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'dateDebut', label: 'Début' },
      { key: 'dateFin', label: 'Fin' },
      { key: 'ordre', label: 'Ordre' },
      { key: 'anneeScolaireCode', label: 'Année scolaire' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      { key: 'dateDebut', label: 'Date de début', type: 'date', required: true },
      { key: 'dateFin', label: 'Date de fin', type: 'date', required: true },
      { key: 'ordre', label: 'Ordre', type: 'number', required: true },
      {
        key: 'anneeScolaireId', label: 'Année scolaire', type: 'select', required: true,
        optionsSource: { path: 'annees-scolaires', valueField: 'id', labelField: 'code' }
      }
    ]
  },
  {
    key: 'salles',
    label: 'Salles',
    path: 'salles',
    roles: ['SADM', 'ADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'capacite', label: 'Capacité' },
      { key: 'localisation', label: 'Localisation' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      { key: 'capacite', label: 'Capacité', type: 'number', required: true },
      { key: 'localisation', label: 'Localisation', type: 'text' }
    ]
  },
  {
    key: 'utilisateurs',
    label: 'Utilisateurs',
    path: 'utilisateurs',
    roles: ['SADM', 'ADM'],
    hint: "Crée uniquement la fiche annuaire. Les identifiants de connexion (compte Keycloak) sont gérés séparément.",
    columns: [
      { key: 'firstName', label: 'Prénom' },
      { key: 'lastName', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'profilLibelle', label: 'Profil' },
      { key: 'actif', label: 'Actif' }
    ],
    fields: [
      { key: 'firstName', label: 'Prénom', type: 'text', required: true },
      { key: 'lastName', label: 'Nom', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'username', label: "Nom d'utilisateur", type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'phone', label: 'Téléphone', type: 'text' },
      {
        key: 'profilCode', label: 'Profil', type: 'select', required: true,
        optionsSource: { path: 'profils', valueField: 'code', labelField: 'libelle' }
      }
    ]
  },
  {
    key: 'profils',
    label: 'Profils',
    path: 'profils',
    roles: ['SADM'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'libelle', label: 'Libellé' },
      { key: 'actif', label: 'Actif' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true, readOnlyOnEdit: true },
      { key: 'libelle', label: 'Libellé', type: 'text', required: true },
      {
        key: 'droits', label: 'Droits', type: 'multiselect',
        optionsSource: { path: 'droits', valueField: 'code', labelField: 'libelle' }
      }
    ]
  }
];
