import { Component } from '@angular/core';
import { AlertComponent } from '../alert/alert.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [AlertComponent],
  templateUrl: './toast-container.component.html',
  styles: ``
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {
  }
}
