import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportService, ReportTemplateItem } from '../../../core/services/report.service';
import { ToastService } from '../../../core/services/toast.service';
import { Option, SelectComponent } from '../../../shared/components/form/select/select.component';

type TemplatePreset = {
  key: string;
  label: string;
  code: string;
  fileName: string;
  typeDocument: string;
  description: string;
};

@Component({
  selector: 'app-template-models',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './template-models.component.html'
})
export class TemplateModelsComponent implements OnInit {
  templates: ReportTemplateItem[] = [];
  templatePresets: TemplatePreset[] = [
    {
      key: 'CERTIFICAT_INSCRIPTION',
      label: 'Certificat d’inscription',
      code: 'CERTIFICAT_INSCRIPTION',
      fileName: 'certificat_inscription.jrxml',
      typeDocument: 'certificat',
      description: 'Modèle utilisé pour le certificat d’inscription'
    },
    {
      key: 'CERTIFICAT_SCOLARITE',
      label: 'Certificat de scolarité',
      code: 'CERTIFICAT_SCOLARITE',
      fileName: 'certificat_scolarite.jrxml',
      typeDocument: 'certificat',
      description: 'Modèle utilisé pour attester la scolarité d’un élève dont l’inscription est validée'
    },
    {
      key: 'RECU_PAIEMENT',
      label: 'Reçu de paiement',
      code: 'RECU_PAIEMENT',
      fileName: 'recu_paiement.jrxml',
      typeDocument: 'recu',
      description: 'Modèle utilisé pour les reçus de paiement'
    },
    {
      key: 'BULLETIN_PERIODE',
      label: 'Bulletin de période',
      code: 'BULLETIN_PERIODE',
      fileName: 'bulletin_periode.jrxml',
      typeDocument: 'bulletin',
      description: 'Modèle utilisé pour le bulletin de période'
    },
    {
      key: 'BULLETIN_PERIODE_CLASSE',
      label: 'Bulletin de période par classe',
      code: 'BULLETIN_PERIODE_CLASSE',
      fileName: 'bulletin_periode_classe.jrxml',
      typeDocument: 'bulletin-classe',
      description: 'Version lot pour une classe entière'
    },
    {
      key: 'PALMARES_CLASSE',
      label: 'Palmarès de classe',
      code: 'PALMARES_CLASSE',
      fileName: 'palmares_classe.jrxml',
      typeDocument: 'palmares',
      description: 'Modèle utilisé pour le palmarès de classe'
    },
    {
      key: 'RELEVE_NOTES_ANNUEL',
      label: 'Relevé de notes annuel',
      code: 'RELEVE_NOTES_ANNUEL',
      fileName: 'releve_notes_annuel.jrxml',
      typeDocument: 'releve',
      description: 'Modèle utilisé pour le relevé de notes annuel'
    }
  ];

  selectedPresetKey = this.templatePresets[0].key;
  loading = false;
  code = '';
  libelle = '';
  typeDocument = this.templatePresets[0].typeDocument;
  description = '';
  file: File | null = null;
  uploading = false;

  constructor(private report: ReportService, private toast: ToastService) {}

  get templatePresetOptions(): Option<string>[] {
    return this.templatePresets.map((preset) => ({
      value: preset.key,
      label: preset.label
    }));
  }

  ngOnInit(): void {
    this.load();
    this.applyPreset(this.selectedPresetKey);
  }

  load(): void {
    this.loading = true;
    this.report.listerModeles().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les modèles.', 'Chargement impossible');
      }
    });
  }

  applyPreset(key: string): void {
    const preset = this.templatePresets.find((item) => item.key === key) ?? this.templatePresets[0];
    this.selectedPresetKey = preset.key;
    this.code = preset.code;
    this.libelle = preset.label;
    this.typeDocument = preset.typeDocument;
    this.description = preset.description;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  upload(): void {
    if (!this.file) {
      this.toast.error('Choisissez un fichier JRXML.', 'Formulaire incomplet');
      return;
    }
    this.uploading = true;
    this.report.uploaderModele({
      code: this.code,
      libelle: this.libelle,
      typeDocument: this.typeDocument,
      description: this.description
    }, this.file).subscribe({
      next: () => {
        this.toast.success('Modèle téléversé.');
        this.uploading = false;
        this.file = null;
        this.load();
      },
      error: () => {
        this.uploading = false;
        this.toast.error('Téléversement impossible.', 'Erreur');
      }
    });
  }

  activate(template: ReportTemplateItem): void {
    this.report.activerModele(template.id).subscribe({
      next: () => {
        this.toast.success('Modèle activé.');
        this.load();
      },
      error: () => this.toast.error('Activation impossible.', 'Erreur')
    });
  }
}
