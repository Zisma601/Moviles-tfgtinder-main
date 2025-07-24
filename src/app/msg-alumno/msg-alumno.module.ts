import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MsgAlumnoPageRoutingModule } from './msg-alumno-routing.module';

import { MsgAlumnoPage } from './msg-alumno.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MsgAlumnoPageRoutingModule
  ],
  declarations: [MsgAlumnoPage]
})
export class MsgAlumnoPageModule {}
