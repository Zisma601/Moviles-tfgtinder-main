import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DescubreAlumPage } from './descubre-alum.page';

const routes: Routes = [
  {
    path: '',
    component: DescubreAlumPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DescubreAlumPageRoutingModule {}
