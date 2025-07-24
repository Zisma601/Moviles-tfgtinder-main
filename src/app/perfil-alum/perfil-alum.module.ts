import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PerfilAlumPageRoutingModule } from './perfil-alum-routing.module';

import { PerfilAlumPage } from './perfil-alum.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PerfilAlumPageRoutingModule
  ],
  declarations: [PerfilAlumPage]
})
export class PerfilAlumPageModule {}
