import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MsgProfPageRoutingModule } from './msg-prof-routing.module';

import { MsgProfPage } from './msg-prof.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MsgProfPageRoutingModule
  ],
  declarations: [MsgProfPage]
})
export class MsgProfPageModule {}
