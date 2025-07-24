import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  styleUrls: ['./edit-modal.component.scss'],
})
export class EditModalComponent {
  @Input() cardData: any = { titulo: '', descripcion: '', titulacion: '' };
  @Input() isNew: boolean = false;
  @Input() docId: string | null = null;

  private idTutor: number | null = null;

  constructor(
    private modalCtrl: ModalController,
    private firestore: AngularFirestore
  ) {}

  ngOnInit() {
    const idTutorStr = localStorage.getItem('id_tutor');
    if (idTutorStr) {
      this.idTutor = parseInt(idTutorStr, 10);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  save() {
    // Validar campos obligatorios
    if (
      !this.cardData.titulo.trim() ||
      !this.cardData.descripcion.trim() ||
      !this.cardData.titulacion.trim()
    ) {
      console.error('Todos los campos son obligatorios.');
      return;
    }

    if (this.isNew) {
      // Generar un id_tfg único
      const idTfg = this.firestore.collection('tfg').doc().ref.id;

      // Lógica para nuevo TFG
      const tfgData = {
        ...this.cardData,
        id_tfg: idTfg,
        id_tutor: this.idTutor,
        id_estudiante: null,
      };

      this.firestore
        .collection('tfg')
        .doc(idTfg) // Usar el id_tfg como ID del documento
        .set(tfgData)
        .then(() => {
          console.log('Nuevo TFG añadido con ID:', idTfg);
          this.dismiss();
        })
        .catch((err) => {
          console.error('Error al añadir TFG:', err);
        });
    } else if (this.docId) {
      // Lógica para actualizar TFG existente
      this.firestore
        .collection('tfg')
        .doc(this.docId)
        .update(this.cardData)
        .then(() => {
          console.log('TFG actualizado');
          this.dismiss();
        })
        .catch((err) => {
          console.error('Error al actualizar TFG:', err);
        });
    }
  }

  delete() {
    if (this.docId) {
      this.firestore
        .collection('tfg')
        .doc(this.docId)
        .delete()
        .then(() => {
          console.log('TFG eliminado con éxito');
          this.dismiss();
        })
        .catch((err) => {
          console.error('Error al eliminar TFG:', err);
        });
    } else {
      console.error('No se ha proporcionado un ID de documento para eliminar.');
    }
  }
}
