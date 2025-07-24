import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { LoginRoutingModule } from './login-routing.module';
import { LoginPage } from './login.page';  // Importar la clase correctamente

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginRoutingModule,
  ],
  declarations: [LoginPage],  // Declarar LoginPage aquí
})
export class LoginPageModule {}
