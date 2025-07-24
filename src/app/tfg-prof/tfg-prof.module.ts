import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TfgProfPageRoutingModule } from './tfg-prof-routing.module';
import { TfgProfPage } from './tfg-prof.page';
import { EditModalComponent } from './edit-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TfgProfPageRoutingModule,
  ],
  declarations: [
    TfgProfPage,
    EditModalComponent,
  ],
})
export class TfgProfPageModule {}
