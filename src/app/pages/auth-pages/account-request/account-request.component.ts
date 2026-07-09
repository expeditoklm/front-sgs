import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { AccountRequestFormComponent } from '../../../shared/components/auth/account-request-form/account-request-form.component';

@Component({
  selector: 'app-account-request',
  imports: [
    AuthPageLayoutComponent,
    AccountRequestFormComponent,
  ],
  templateUrl: './account-request.component.html',
  styles: ``
})
export class AccountRequestComponent {

}
