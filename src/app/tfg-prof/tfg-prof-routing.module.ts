import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TfgProfPage } from './tfg-prof.page';

const routes: Routes = [
  {
    path: '',
    component: TfgProfPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TfgProfPageRoutingModule {}
