import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of, Subscription } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

interface Estudiante {
  id_estudiante: number;
  nombre: string;
  password: string;
  titulacion: string;
}

interface Tutor {
  id_tutor: number;
  nombre: string;
}

interface Tfg {
  id_tfg: number;
  titulo: string;
  tfg_estado: string;
  id_tutor: number;
  id_estudiante: number;
  titulacion: string;
}

interface Chat {
  id_estudiante: number;
  id_tfg: number;
  id_tutor: number;
  message: string;
  sender_type: string; // 'tutor' o 'estudiante'
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-msg-alumno',
  templateUrl: './msg-alumno.page.html',
  styleUrls: ['./msg-alumno.page.scss'],
})
export class MsgAlumnoPage implements OnInit, OnDestroy {
  tfg$: Observable<Tfg | null> = of(null); // TFG Observable
  tutor$: Observable<Tutor | null> = of(null); // Tutor Observable
  hasUnreadMessages = false; // Indica si hay mensajes no leídos
  private unreadMessagesSubscription: Subscription | null = null;

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    const nombreEstudiante = localStorage.getItem('nombre_estudiante');

    if (nombreEstudiante) {
      this.tfg$ = this.firestore
        .collection('estudiante', (ref) => ref.where('nombre', '==', nombreEstudiante))
        .get()
        .pipe(
          switchMap((snapshot) => {
            if (!snapshot || snapshot.empty) {
              console.warn('[WARN] No se encontró ningún estudiante con el nombre:', nombreEstudiante);
              return of(null);
            }
            const estudiante = snapshot.docs[0].data() as Estudiante;
            console.log('[LOG] Estudiante encontrado:', estudiante);
            this.checkUnreadMessages(estudiante.id_estudiante); // Verificar mensajes no leídos
            return this.firestore
              .collection('tfg', (ref) => ref.where('id_estudiante', '==', estudiante.id_estudiante).limit(1))
              .get();
          }),
          map((snapshot) => {
            if (!snapshot || snapshot.empty || !snapshot.docs.length) {
              console.warn('[WARN] No se encontró ningún TFG.');
              return null;
            }
            const tfg = snapshot.docs[0].data() as Tfg;
            console.log('[LOG] TFG encontrado:', tfg);
            return tfg;
          }),
          catchError((err) => {
            console.error('[ERROR] Error al cargar el TFG:', err);
            return of(null);
          })
        );

      this.tutor$ = this.tfg$.pipe(
        switchMap((tfg) => {
          if (!tfg) return of(null);
          console.log('[LOG] Buscando Tutor para el ID:', tfg.id_tutor);
          return this.firestore
            .collection('tutor', (ref) => ref.where('id_tutor', '==', tfg.id_tutor).limit(1))
            .get();
        }),
        map((snapshot) => {
          if (!snapshot || snapshot.empty || !snapshot.docs.length) {
            console.warn('[WARN] No se encontró tutor.');
            return null;
          }
          const tutor = snapshot.docs[0].data() as Tutor;
          console.log('[LOG] Tutor encontrado:', tutor);
          return tutor;
        }),
        catchError((err) => {
          console.error('[ERROR] Error al cargar el Tutor:', err);
          return of(null);
        })
      );
    } else {
      console.warn('[WARN] No se encontró el nombre del estudiante en localStorage.');
    }
  }

  ngOnDestroy() {
    if (this.unreadMessagesSubscription) {
      this.unreadMessagesSubscription.unsubscribe();
    }
  }

  checkUnreadMessages(estudianteId: number) {
    this.firestore
      .collection('chat', (ref) =>
        ref
          .where('id_estudiante', '==', estudianteId)
          .where('sender_type', '==', 'tutor') // Mensajes enviados por el tutor
          .where('read', '==', false) // Mensajes no leídos
      )
      .valueChanges({ idField: 'id' })
      .subscribe((messages: any[]) => {
        const chats = messages as Chat[];
        this.hasUnreadMessages = chats.length > 0; // Solo detectar si hay mensajes no leídos
        console.log('[LOG] Mensajes no leídos encontrados para el alumno:', chats);
      });
  }

  generateEmail(nombre: string): string {
    // Eliminar acentos y caracteres especiales
    const eliminarAcentos = (texto: string): string =>
      texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
    // Procesar el nombre
    const nombreProcesado = eliminarAcentos(nombre)
      .toLowerCase()          // Convertir todo a minúsculas
      .replace(/\s+/g, '')    // Eliminar espacios en blanco
      .replace(/[^a-z0-9]/g, ''); // Eliminar caracteres no válidos (solo letras y números)
  
    return `${nombreProcesado}@gmail.com`;
  }
  
  
}
