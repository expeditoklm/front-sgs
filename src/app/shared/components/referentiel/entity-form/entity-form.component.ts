import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { SelectComponent, SelectSearchFn } from '../../form/select/select.component';
import { MultiSelectComponent } from '../../form/multi-select/multi-select.component';
import { FileInputComponent } from '../../form/input/file-input.component';
import { FieldConfig, SelectOption } from '../../../../core/models/referentiel-crud.models';
import { ReferentielCrudService } from '../../../../core/services/referentiel-crud.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-entity-form',
  imports: [
    LabelComponent,
    InputFieldComponent,
    CheckboxComponent,
    SelectComponent,
    MultiSelectComponent,
    FileInputComponent
  ],
  templateUrl: './entity-form.component.html',
  styles: ``
})
export class EntityFormComponent implements OnChanges {
  @Input() fields: FieldConfig[] = [];
  @Input() model: Record<string, any> = {};
  @Input() isEdit = false;

  @Output() modelChange = new EventEmitter<Record<string, any>>();
  @Output() fileUploadingChange = new EventEmitter<boolean>();

  dynamicOptions: Record<string, SelectOption[]> = {};
  dynamicSearch: Record<string, SelectSearchFn<string>> = {};
  uploadingFiles: Record<string, boolean> = {};
  fileErrors: Record<string, string> = {};
  localPreviews: Record<string, string> = {};
  previewFailures: Record<string, boolean> = {};
  preservePreviewOnNextModelChange: Record<string, boolean> = {};

  constructor(private crudService: ReferentielCrudService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields']) {
      this.loadDynamicOptions();
    }
    if (changes['model'] && !changes['model'].firstChange) {
      Object.keys(this.localPreviews).forEach((key) => {
        if (this.preservePreviewOnNextModelChange[key]) {
          this.preservePreviewOnNextModelChange[key] = false;
        } else {
          delete this.localPreviews[key];
        }
      });
      this.fileErrors = {};
      this.previewFailures = {};
    }
  }

  private loadDynamicOptions(): void {
    this.fields
      .filter((field) => field.optionsSource)
      .forEach((field) => {
        const source = field.optionsSource!;
        if (source.businessParameterGroup) {
          this.crudService.businessParameterOptions(source.businessParameterGroup).subscribe({
            next: (items) => {
              this.dynamicOptions[field.key] = items.map((item) => ({
                value: String(item[source.valueField as keyof typeof item]),
                label: String(item[source.labelField as keyof typeof item])
              }));
            },
            error: () => (this.dynamicOptions[field.key] = [])
          });
          return;
        }
        this.dynamicSearch[field.key] = (term, limit) => this.crudService
          .list(source.path, { page: 1, size: limit, sortField: 'id', sortOrder: 'ASC', filter: term })
          .pipe(map(page => page.content.map(item => ({
            value: String(item[source.valueField]),
            label: String(item[source.labelField])
          }))));
        this.crudService
          .list(source.path, { page: 1, size: field.type === 'multiselect' ? 200 : 10, sortField: 'id', sortOrder: 'ASC', filter: '' })
          .subscribe({
            next: (page) => {
              this.dynamicOptions[field.key] = page.content.map((item) => ({
                value: String(item[source.valueField]),
                label: String(item[source.labelField])
              }));
            },
            error: () => (this.dynamicOptions[field.key] = [])
          });
      });
  }

  optionsFor(field: FieldConfig): SelectOption[] {
    return field.staticOptions ?? this.dynamicOptions[field.key] ?? [];
  }

  searchFor(field: FieldConfig): SelectSearchFn<string> | undefined {
    return this.dynamicSearch[field.key];
  }

  multiSelectOptions(field: FieldConfig): { value: string; text: string }[] {
    return this.optionsFor(field).map((option) => ({ value: option.value, text: option.label }));
  }

  get visibleFields(): FieldConfig[] {
    return this.fields.filter((field) => !field.visibleWhen
      || this.model[field.visibleWhen.key] === field.visibleWhen.value);
  }

  isDisabled(field: FieldConfig): boolean {
    return this.isEdit && !!field.readOnlyOnEdit;
  }

  update(key: string, value: unknown): void {
    this.model = { ...this.model, [key]: value };
    this.modelChange.emit(this.model);
  }

  filePreview(field: FieldConfig): string {
    return this.localPreviews[field.key] || String(this.model[field.key] ?? '');
  }

  selectFile(field: FieldConfig, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.fileErrors[field.key] = 'Veuillez choisir un fichier image valide.';
      input.value = '';
      return;
    }

    this.fileErrors[field.key] = '';
    this.previewFailures[field.key] = false;
    this.uploadingFiles[field.key] = true;
    this.emitUploadingState();
    const reader = new FileReader();
    reader.onload = () => (this.localPreviews[field.key] = String(reader.result ?? ''));
    reader.readAsDataURL(file);

    this.crudService.uploadFile(file, field.uploadDirectory ?? 'referentiels').subscribe({
      next: (uploaded) => {
        this.uploadingFiles[field.key] = false;
        this.emitUploadingState();
        this.preservePreviewOnNextModelChange[field.key] = true;
        this.update(field.key, this.crudService.publicLogoUrl(uploaded.download));
      },
      error: (error) => {
        this.uploadingFiles[field.key] = false;
        this.emitUploadingState();
        delete this.localPreviews[field.key];
        this.fileErrors[field.key] = this.extractFileError(error);
        input.value = '';
      }
    });
  }

  clearFile(field: FieldConfig): void {
    this.localPreviews[field.key] = '';
    this.fileErrors[field.key] = '';
    this.previewFailures[field.key] = false;
    this.update(field.key, null);
  }

  markPreviewAsFailed(field: FieldConfig): void {
    this.previewFailures[field.key] = true;
  }

  private emitUploadingState(): void {
    this.fileUploadingChange.emit(Object.values(this.uploadingFiles).some(Boolean));
  }

  private extractFileError(error: any): string {
    const body = error?.error;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return body?.message
      || body?.details
      || body?.fileName
      || error?.message
      || "Impossible d'envoyer cette image.";
  }
}
