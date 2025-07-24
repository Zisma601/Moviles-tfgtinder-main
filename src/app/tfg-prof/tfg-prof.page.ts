import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ModalController } from '@ionic/angular';
import { EditModalComponent } from '../tfg-prof/edit-modal.component'; // Asegúrate de que la ruta es correcta

@Component({
  selector: 'app-tfg-prof',
  templateUrl: './tfg-prof.page.html',
  styleUrls: ['./tfg-prof.page.scss'],
})
export class TfgProfPage {
  cards: { titulo: string; descripcion: string; id: string }[] = []; // Incluye el ID del documento
  idTutor: number | null = null; // ID del tutor logueado

  constructor(private firestore: AngularFirestore, private modalCtrl: ModalController) {}

  ngOnInit() {
    const idTutorStr = localStorage.getItem('id_tutor');
    if (idTutorStr) {
      this.idTutor = parseInt(idTutorStr, 10);
      console.log('ID del Tutor recuperado de localStorage:', this.idTutor);
      this.loadTfg();  // Cargar los TFGs al iniciar
    } else {
      console.error('No se encontró el ID del tutor en localStorage.');
    }
  }
  

  loadTfg() {
    if (!this.idTutor) {
      console.error('ID del Tutor no definido.');
      return;
    }
  
    this.firestore
      .collection('tfg', (ref) => ref.where('id_tutor', '==', this.idTutor))  // Filtrado por ID del tutor
      .snapshotChanges()  // Escuchar cambios en tiempo real
      .subscribe((snapshot) => {
        this.cards = snapshot.map((doc: any) => {
          const data = doc.payload.doc.data();
          const id = doc.payload.doc.id; // Obtener el ID de cada documento
          return {
            id,
            titulo: data.titulo || 'Sin título',  // Título de la tarjeta
            descripcion: data.descripcion || 'Sin descripción',  // Descripción de la tarjeta
            titulacion: data.titulacion || 'Sin titulacion',  // Titulación de la tarjeta
          };
        });
        console.log('Cards cargadas:', this.cards);  // Verificar que se actualicen correctamente
      });
  }

  async openEditModal(card: any, index: number) {
    const modal = await this.modalCtrl.create({
      component: EditModalComponent,
      componentProps: {
        cardData: { ...card }, // Datos de la tarjeta
        docId: card.id, // ID del documento
        isNew: false, // Indicar que estamos editando
      },
    });
  
    await modal.present();
  
    modal.onDidDismiss().then(() => {
      this.loadTfg(); // Recargar tarjetas después de cerrar el modal
    });
  }
  
  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: EditModalComponent,
      componentProps: {
        cardData: { titulo: '', descripcion: '', titulacion: '' }, // Datos vacíos para un nuevo TFG
        isNew: true, // Indicamos que es un nuevo TFG
      },
    });
  
    await modal.present();
  
    modal.onDidDismiss().then(() => {
      this.loadTfg();  // Recargar los TFGs después de añadir uno nuevo
    });
  }
  
  
  
}
