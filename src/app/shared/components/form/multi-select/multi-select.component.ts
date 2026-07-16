import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Option {
  value: string;
  text: string;
}

@Component({
  selector: 'app-multi-select',
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './multi-select.component.html',
  styles: ``
})
export class MultiSelectComponent implements OnInit, OnChanges {

  @Input() label: string = '';
  @Input() options: Option[] = [];
  @Input() defaultSelected: string[] = [];
  @Input() disabled: boolean = false;
  @Output() selectionChange = new EventEmitter<string[]>();

  selectedOptions: string[] = [];
  isOpen = false;
  query = '';
  @Input() resultLimit = 10;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnInit() {
    this.selectedOptions = [...this.defaultSelected];
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['defaultSelected']) {
      this.selectedOptions = [...(this.defaultSelected ?? [])];
    }
  }

  toggleDropdown() {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  get displayedOptions(): Option[] {
    const term = this.normalize(this.query);
    return this.options
      .filter(option => !term || this.normalize(option.text).includes(term))
      .slice(0, Math.max(1, this.resultLimit));
  }

  handleSelect(optionValue: string) {
    if (this.selectedOptions.includes(optionValue)) {
      this.selectedOptions = this.selectedOptions.filter(v => v !== optionValue);
    } else {
      this.selectedOptions = [...this.selectedOptions, optionValue];
    }
    this.selectionChange.emit(this.selectedOptions);
  }

  removeOption(value: string) {
    this.selectedOptions = this.selectedOptions.filter(opt => opt !== value);
    this.selectionChange.emit(this.selectedOptions);
  }

  get selectedValuesText(): string[] {
    return this.selectedOptions
      .map(value => this.options.find(option => option.value === value)?.text || '')
      .filter(Boolean);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
