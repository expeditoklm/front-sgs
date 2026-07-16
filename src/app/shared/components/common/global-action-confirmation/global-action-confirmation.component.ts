import { Component } from '@angular/core';
import { ModalComponent } from '../../ui/modal/modal.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { ActionConfirmationService } from '../../../../core/services/action-confirmation.service';

@Component({
  selector: 'app-global-action-confirmation',
  imports: [ModalComponent, ButtonComponent],
  templateUrl: './global-action-confirmation.component.html'
})
export class GlobalActionConfirmationComponent {
  constructor(public confirmations: ActionConfirmationService) {
  }
}
