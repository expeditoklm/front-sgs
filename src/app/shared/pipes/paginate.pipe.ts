import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginate',
  standalone: true,
  pure: true
})
export class PaginatePipe implements PipeTransform {
  transform<T>(items: readonly T[] | null | undefined, page = 1, pageSize = 10): T[] {
    if (!items?.length) {
      return [];
    }
    const safeSize = Math.max(1, pageSize);
    const safePage = Math.max(1, page);
    const start = (safePage - 1) * safeSize;
    return items.slice(start, start + safeSize);
  }
}
