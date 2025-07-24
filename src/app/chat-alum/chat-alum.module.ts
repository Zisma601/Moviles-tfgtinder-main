import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ChatAlumPageRoutingModule } from './chat-alum-routing.module';

import { ChatAlumPage } from './chat-alum.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChatAlumPageRoutingModule
  ],
  declarations: [ChatAlumPage]
})
export class ChatAlumPageModule {}
