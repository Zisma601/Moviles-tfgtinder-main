import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChatProfPage } from './chat-prof.page';

const routes: Routes = [
  {
    path: '',
    component: ChatProfPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChatProfPageRoutingModule {}
