import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChatAlumPage } from './chat-alum.page';

const routes: Routes = [
  {
    path: '',
    component: ChatAlumPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChatAlumPageRoutingModule {}
