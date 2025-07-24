import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ModalController } from '@ionic/angular';
import { EditModalComponent } from '../tfg-prof/edit-modal.component'; // Ruta del componente EditModal

interface Tutor {
  id_tutor: number;
  nombre: string;
  password: string;
}

@Component({
  selector: 'app-perfil-prof',
  templateUrl: './perfil-prof.page.html',
  styleUrls: ['./perfil-prof.page.scss'],
})
export class PerfilProfPage {
  cards: { titulo: string; descripcion: string; id: string; status: string; id_estudiante: number | null }[] = [];
  nombreTutor: string = '';  // Para almacenar el nombre del tutor
  idTutor: number | null = null; // ID del tutor logueado

  constructor(private firestore: AngularFirestore, private modalCtrl: ModalController) {}

  ngOnInit() {
    // Recuperar el id_tutor del localStorage
    const idTutorStr = localStorage.getItem('id_tutor');
    if (idTutorStr) {
      this.idTutor = parseInt(idTutorStr, 10);
      console.log('ID del Tutor recuperado de localStorage:', this.idTutor);
      this.loadTutorNombre();  // Cargar el nombre del tutor
      this.loadTfg();  // Cargar los TFGs al iniciar
    } else {
      console.error('No se encontró el ID del tutor en localStorage.');
    }
  }

  loadTutorNombre() {
    if (this.idTutor) {
      this.firestore
        .collection('tutor', ref => ref.where('id_tutor', '==', this.idTutor)) // Buscar por id_tutor
        .get()
        .subscribe(snapshot => {
          if (!snapshot.empty) {
            // Tipo explícito para el objeto tutor
            const tutor = snapshot.docs[0].data() as Tutor;  // Especificamos el tipo 'Tutor'
            this.nombreTutor = tutor.nombre;  // Accedemos al 'nombre' de forma segura
            console.log('Nombre del tutor:', this.nombreTutor);  // Verifica si el nombre se obtiene
          } else {
            console.error('No se encontró un tutor con el ID proporcionado.');
          }
        });
    }
  }

  loadTfg() {
    if (!this.idTutor) {
      console.error('ID del Tutor no definido.');
      return;
    }

    this.firestore
      .collection('tfg', (ref) => ref.where('id_tutor', '==', this.idTutor)) // Filtrar por ID del tutor
      .snapshotChanges() // Escuchar cambios en tiempo real
      .subscribe((snapshot) => {
        this.cards = snapshot.map((doc: any) => {
          const data = doc.payload.doc.data();
          const id = doc.payload.doc.id; // Obtener el ID de cada documento
          return {
            id,
            titulo: data.titulo || 'Sin título',
            descripcion: data.descripcion || 'Sin descripción',
            status: data.status || 'Pendiente', // Agregar estado
            id_estudiante: data.id_estudiante || null // Agregar id_estudiante
          };
        });
        console.log('Cards cargadas:', this.cards);
      });
  }

  async openEditModal(card: any, index: number) {
    const modal = await this.modalCtrl.create({
      component: EditModalComponent,
      componentProps: {
        cardData: { ...card },
        docId: card.id,
        isNew: false,
      },
    });

    await modal.present();

    modal.onDidDismiss().then(() => {
      this.loadTfg(); // Recargar las tarjetas después de cerrar el modal
    });
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: EditModalComponent,
      componentProps: {
        cardData: { titulo: '', descripcion: '', status: '' }, // Datos vacíos para el nuevo TFG
        isNew: true,
      },
    });

    await modal.present();

    modal.onDidDismiss().then(() => {
      this.loadTfg(); // Recargar las tarjetas después de añadir un nuevo TFG
    });
  }

  getStatusClass(tfg: { id_estudiante: number | null }) {
    // Si id_estudiante es null, usamos verde; si tiene valor, usamos rojo
    return tfg.id_estudiante === null ? 'green' : 'red';
  }

  async openEditProfileModal() {
    // Lógica para abrir el modal de edición de perfil, si es necesario
  }
}
