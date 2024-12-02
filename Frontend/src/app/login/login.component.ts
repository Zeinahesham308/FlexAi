import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  showForgetPassword: boolean = false

  toggleForgetPassword() {
    this.showForgetPassword = !this.showForgetPassword
  }

}
