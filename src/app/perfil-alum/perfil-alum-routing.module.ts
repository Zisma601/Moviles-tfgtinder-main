import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PerfilAlumPage } from './perfil-alum.page';

const routes: Routes = [
  {
    path: '',
    component: PerfilAlumPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PerfilAlumPageRoutingModule {}
