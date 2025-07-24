import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { ChatProfPage } from './chat-prof.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: ChatProfPage, // Asegúrate de que sea el nombre correcto
      },
    ]),
  ],
  declarations: [ChatProfPage],
})
export class ChatProfPageModule {}
