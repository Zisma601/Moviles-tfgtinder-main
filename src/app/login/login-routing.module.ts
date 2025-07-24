import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login.page';  // Asegúrate de que el nombre de la clase sea correcto

const routes: Routes = [
  {
    path: '',
    component: LoginPage,  // Asocia la ruta con la página de login
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginRoutingModule {}
