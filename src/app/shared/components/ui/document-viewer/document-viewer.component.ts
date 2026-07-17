import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { downloadBlob } from '../../../../core/helpers/download.helpers';
import {
  DocumentViewerDocument,
  DocumentViewerService
} from '../../../../core/services/document-viewer.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../button/button.component';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-document-viewer',
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './document-viewer.component.html'
})
export class DocumentViewerComponent implements OnInit, OnDestroy {
  document: DocumentViewerDocument | null = null;
  objectUrl = '';
  safeUrl: SafeResourceUrl | null = null;
  private subscription?: Subscription;

  constructor(
    private readonly viewer: DocumentViewerService,
    private readonly sanitizer: DomSanitizer,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.subscription = this.viewer.document$.subscribe((document) => {
      this.revokeObjectUrl();
      this.document = document;
      if (document) {
        this.objectUrl = URL.createObjectURL(document.blob);
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.revokeObjectUrl();
  }

  get isPdf(): boolean {
    return !!this.document && (this.document.blob.type.includes('pdf') || this.document.fileName.toLowerCase().endsWith('.pdf'));
  }

  get isImage(): boolean {
    return !!this.document && this.document.blob.type.startsWith('image/');
  }

  close(): void {
    this.viewer.close();
  }

  save(): void {
    if (!this.document) return;
    downloadBlob(this.document.blob, this.document.fileName);
  }

  print(): void {
    if (!this.document || !this.objectUrl) return;
    if (!this.isPdf && !this.isImage) {
      this.toastService.warning("L'impression directe n'est disponible que pour les PDF et les images.");
      return;
    }

    const frame = window.document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.src = this.objectUrl;
    frame.onload = () => {
      window.setTimeout(() => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        window.setTimeout(() => frame.remove(), 1000);
      }, 250);
    };
    window.document.body.appendChild(frame);
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = '';
    this.safeUrl = null;
  }
}
