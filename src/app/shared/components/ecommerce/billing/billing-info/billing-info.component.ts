import { Component } from '@angular/core';
import { ModalComponent } from '../../../ui/modal/modal.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from '../../../form/select/select.component';

@Component({
  selector: 'app-billing-info',
  imports: [
    ModalComponent,
    ButtonComponent,
    FormsModule,
    SelectComponent,
  ],
  templateUrl: './billing-info.component.html',
  host: {
    class: 'rounded-2xl border border-gray-200 bg-white xl:w-2/6 dark:border-gray-800 dark:bg-white/[0.03]',
  },
})
export class BillingInfoComponent {

  isOpen = false;
  country = '';
  city = '';
  readonly countryOptions = ['USA', 'UK', 'BD', 'EU', 'ID'].map(value => ({ value, label: value }));
  readonly cityOptions = ['New York', 'Tokyo', 'Chicago', 'Los Angeles', 'Berlin'].map(value => ({ value, label: value }));

  openModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
  }

  handleSave ()  {
    // Handle save logic here
    console.log("Saving changes...");
    this.closeModal();
  };
}
