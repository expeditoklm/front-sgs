import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, isObservable } from 'rxjs';

export interface Option<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
}

export type SelectSearchFn<T = any> =
  (term: string, limit: number) => Observable<Option<T>[]> | Promise<Option<T>[]>;

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent<T = any>
  implements OnInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() options: Option<T>[] = [];
  @Input() placeholder = 'Sélectionner';
  @Input() searchPlaceholder = 'Rechercher...';
  @Input() className = '';
  @Input() defaultValue: T | '' | null = '';
  @Input() value: T | '' | null = '';
  @Input() disabled = false;
  @Input() searchable = true;
  @Input() clearable = false;
  @Input() resultLimit = 10;
  @Input() searchFn?: SelectSearchFn<T>;

  @Output() valueChange = new EventEmitter<T | '' | null>();
  @Output() searchChange = new EventEmitter<string>();

  open = false;
  query = '';
  loading = false;
  remoteOptions: Option<T>[] = [];
  activeIndex = -1;

  private searchTimer?: ReturnType<typeof setTimeout>;
  private onTouched: () => void = () => undefined;
  private onModelChange: (value: T | '' | null) => void = () => undefined;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    if (!this.hasValue(this.value) && this.hasValue(this.defaultValue)) {
      this.setValue(this.defaultValue, false);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && !changes['options'].firstChange) {
      this.ensureSelectedOptionIsVisible();
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  get selectedOption(): Option<T> | undefined {
    return [...this.options, ...this.remoteOptions]
      .find((option) => this.sameValue(option.value, this.value));
  }

  get displayedOptions(): Option<T>[] {
    const source = this.searchFn && this.query.trim()
      ? this.remoteOptions
      : this.options;
    const normalizedQuery = this.normalize(this.query);
    const filtered = normalizedQuery && !this.searchFn
      ? source.filter((option) => this.normalize(option.label).includes(normalizedQuery))
      : source;

    const selected = this.selectedOption;
    const limited = filtered.slice(0, Math.max(1, this.resultLimit));
    if (selected && !limited.some((option) => this.sameValue(option.value, selected.value))) {
      return [selected, ...limited].slice(0, Math.max(1, this.resultLimit));
    }
    return limited;
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }
    this.open ? this.close() : this.openDropdown();
  }

  openDropdown(): void {
    if (this.disabled) {
      return;
    }
    this.open = true;
    this.activeIndex = this.displayedOptions.findIndex(
      (option) => this.sameValue(option.value, this.value)
    );
  }

  close(): void {
    this.open = false;
    this.activeIndex = -1;
    this.onTouched();
  }

  select(option: Option<T>): void {
    if (option.disabled) {
      return;
    }
    this.setValue(option.value);
    this.query = '';
    this.close();
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.setValue('');
    this.query = '';
  }

  onSearch(term: string): void {
    this.query = term;
    this.activeIndex = -1;
    this.searchChange.emit(term);

    if (!this.searchFn) {
      return;
    }
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.executeRemoteSearch(term.trim()), 300);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }
    if (!this.open && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.openDropdown();
      return;
    }
    if (!this.open) {
      return;
    }

    const options = this.displayedOptions;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, options.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
    } else if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      this.select(options[this.activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  writeValue(value: T | '' | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: T | '' | null) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  private executeRemoteSearch(term: string): void {
    if (!this.searchFn) {
      return;
    }
    this.loading = true;
    try {
      const result = this.searchFn(term, this.resultLimit);
      if (isObservable(result)) {
        result.subscribe({
          next: (options) => {
            this.remoteOptions = (options ?? []).slice(0, this.resultLimit);
            this.loading = false;
          },
          error: () => {
            this.remoteOptions = [];
            this.loading = false;
          },
        });
      } else {
        Promise.resolve(result)
          .then((options) => this.remoteOptions = (options ?? []).slice(0, this.resultLimit))
          .catch(() => this.remoteOptions = [])
          .finally(() => this.loading = false);
      }
    } catch {
      this.remoteOptions = [];
      this.loading = false;
    }
  }

  private setValue(value: T | '' | null, emit = true): void {
    this.value = value;
    if (emit) {
      this.valueChange.emit(value);
      this.onModelChange(value);
    }
  }

  private ensureSelectedOptionIsVisible(): void {
    if (!this.hasValue(this.value)) {
      return;
    }
    const selected = this.options.find((option) => this.sameValue(option.value, this.value));
    if (selected && !this.remoteOptions.some((option) => this.sameValue(option.value, selected.value))) {
      this.remoteOptions = [selected, ...this.remoteOptions];
    }
  }

  private hasValue(value: unknown): boolean {
    return value !== '' && value !== null && value !== undefined;
  }

  sameValue(left: unknown, right: unknown): boolean {
    return left === right || String(left ?? '') === String(right ?? '');
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .trim();
  }
}
