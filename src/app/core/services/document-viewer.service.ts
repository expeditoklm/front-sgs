import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DocumentViewerDocument {
  blob: Blob;
  title: string;
  fileName: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentViewerService {
  private readonly documentSubject = new BehaviorSubject<DocumentViewerDocument | null>(null);
  readonly document$ = this.documentSubject.asObservable();

  open(blob: Blob, title: string, fileName: string): void {
    this.documentSubject.next({ blob, title, fileName: this.withExtension(fileName, blob.type) });
  }

  close(): void {
    this.documentSubject.next(null);
  }

  private withExtension(fileName: string, mimeType: string): string {
    if (/\.[a-z0-9]{2,5}$/i.test(fileName)) return fileName;
    const extension = mimeType.includes('pdf')
      ? '.pdf'
      : mimeType.startsWith('image/')
        ? `.${mimeType.substring('image/'.length).replace('jpeg', 'jpg')}`
        : '';
    return `${fileName}${extension}`;
  }
}
