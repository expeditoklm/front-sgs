import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { SelectComponent } from '../../form/select/select.component';
import { MultiSelectComponent } from '../../form/multi-select/multi-select.component';
import { FieldConfig, SelectOption } from '../../../../core/models/referentiel-crud.models';
import { ReferentielCrudService } from '../../../../core/services/referentiel-crud.service';

@Component({
  selector: 'app-entity-form',
  imports: [
    LabelComponent,
    InputFieldComponent,
    CheckboxComponent,
    SelectComponent,
    MultiSelectComponent
  ],
  templateUrl: './entity-form.component.html',
  styles: ``
})
export class EntityFormComponent implements OnChanges {
  @Input() fields: FieldConfig[] = [];
  @Input() model: Record<string, any> = {};
  @Input() isEdit = false;

  @Output() modelChange = new EventEmitter<Record<string, any>>();

  dynamicOptions: Record<string, SelectOption[]> = {};

  constructor(private crudService: ReferentielCrudService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields']) {
      this.loadDynamicOptions();
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
        this.crudService
          .list(source.path, { page: 1, size: 200, sortField: 'id', sortOrder: 'ASC', filter: '' })
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

  multiSelectOptions(field: FieldConfig): { value: string; text: string }[] {
    return this.optionsFor(field).map((option) => ({ value: option.value, text: option.label }));
  }

  isDisabled(field: FieldConfig): boolean {
    return this.isEdit && !!field.readOnlyOnEdit;
  }

  update(key: string, value: unknown): void {
    this.model = { ...this.model, [key]: value };
    this.modelChange.emit(this.model);
  }
}
