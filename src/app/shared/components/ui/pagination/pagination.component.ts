import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '../../form/select/select.component';

type PaginationItem = number | 'ellipsis';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectComponent],
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 15, 25, 50];
  @Input() itemLabel = 'élément';
  @Input() showPageSize = true;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get normalizedTotalPages(): number {
    return Math.max(1, this.totalPages || 1);
  }

  get firstItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get lastItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get displayedItemLabel(): string {
    if (this.totalItems <= 1 || /[sxz]$/i.test(this.itemLabel)) {
      return this.itemLabel;
    }
    return `${this.itemLabel}s`;
  }

  get pageSizeSelectOptions() {
    return this.pageSizeOptions.map(size => ({ value: size, label: `${size} / page` }));
  }

  get pageItems(): PaginationItem[] {
    const total = this.normalizedTotalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, total]);
    for (let page = this.currentPage - 1; page <= this.currentPage + 1; page++) {
      if (page > 1 && page < total) {
        pages.add(page);
      }
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const items: PaginationItem[] = [];
    sorted.forEach((page, index) => {
      if (index > 0 && page - sorted[index - 1] > 1) {
        items.push('ellipsis');
      }
      items.push(page);
    });
    return items;
  }

  goTo(page: number): void {
    if (page < 1 || page > this.normalizedTotalPages || page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }

  changePageSize(value: number | string): void {
    const size = Number(value);
    if (Number.isFinite(size) && size > 0 && size !== this.pageSize) {
      this.pageSizeChange.emit(size);
    }
  }
}
