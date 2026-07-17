import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastContainerComponent } from './shared/components/ui/toast-container/toast-container.component';
import { DocumentViewerComponent } from './shared/components/ui/document-viewer/document-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    ToastContainerComponent,
    DocumentViewerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'SGS';
}
