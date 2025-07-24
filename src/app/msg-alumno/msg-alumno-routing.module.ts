import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MsgAlumnoPage } from './msg-alumno.page';

const routes: Routes = [
  {
    path: '',
    component: MsgAlumnoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MsgAlumnoPageRoutingModule {}
