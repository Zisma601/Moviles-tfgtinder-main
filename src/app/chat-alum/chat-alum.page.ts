import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, Subscription, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface Chat {
  id: string;
  id_estudiante: number;
  id_tfg: number;
  id_tutor: number;
  message: string;
  sender_type: string; // 'tutor' o 'estudiante'
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-chat-alum',
  templateUrl: './chat-alum.page.html',
  styleUrls: ['./chat-alum.page.scss'],
})
export class ChatAlumPage implements OnInit, OnDestroy {
  tutorName: string = '';
  startDate: string = '';
  endDate: string = '';
  messages$: Observable<Chat[]> = of([]);
  newMessage: string = '';
  id_tfg: number = 0;
  id_estudiante: number = 0;
  id_tutor: number = 0;
  private subscriptions: Subscription = new Subscription();
  private isChatActive: boolean = false; // Indica si el usuario está dentro del chat
  private checkMessagesInterval: any; // Intervalo para comprobar mensajes
  notaEstudiante: string = '';


  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.isChatActive = true; // Activar el chat al entrar
    const nombreEstudiante = localStorage.getItem('nombre_estudiante');

    if (nombreEstudiante) {
      this.loadData(nombreEstudiante);
    } else {
      console.warn('[WARN] No se encontró el nombre del estudiante en localStorage.');
    }

    this.startMessageCheck();
  }

  ngOnDestroy() {
    this.isChatActive = false; // Desactivar el chat al salir
    clearInterval(this.checkMessagesInterval); // Detener el intervalo de comprobación
    this.subscriptions.unsubscribe(); // Cancelar suscripciones
  }

  @HostListener('window:focus', ['$event'])
  onFocus() {
    this.isChatActive = true;
    console.log('[DEBUG] Chat activo.');
  }

  @HostListener('window:blur', ['$event'])
  onBlur() {
    this.isChatActive = false;
    console.log('[DEBUG] Chat inactivo.');
  }

  private loadData(nombreEstudiante: string) {
    this.firestore
      .collection('estudiante', (ref) => ref.where('nombre', '==', nombreEstudiante))
      .get()
      .subscribe((estudianteSnapshot) => {
        if (!estudianteSnapshot.empty) {
          const estudiante = estudianteSnapshot.docs[0].data() as any;
          this.id_estudiante = estudiante.id_estudiante;
          this.fetchNotaEstudiante();
          this.firestore
            .collection('tfg', (ref) => ref.where('id_estudiante', '==', this.id_estudiante).limit(1))
            .get()
            .subscribe((tfgSnapshot) => {
              if (!tfgSnapshot.empty) {
                const tfg = tfgSnapshot.docs[0].data() as any;
                this.id_tfg = tfg.id_tfg;
                this.startDate = tfg.fecha_inicio || '';
                this.endDate = tfg.fecha_fin || '';
                this.id_tutor = tfg.id_tutor;

                this.firestore
                  .collection('tutor', (ref) => ref.where('id_tutor', '==', this.id_tutor))
                  .get()
                  .subscribe((tutorSnapshot) => {
                    if (!tutorSnapshot.empty) {
                      const tutor = tutorSnapshot.docs[0].data() as any;
                      this.tutorName = tutor.nombre;
                      console.log('[DEBUG] Tutor encontrado:', this.tutorName);
                    } else {
                      console.warn('[WARN] No se encontró el tutor asociado.');
                    }
                    this.loadMessages();
                  });
              }
            });
        }
      });
  }

  loadMessages() {
    this.messages$ = this.firestore
      .collection<Chat>('chat', (ref) =>
        ref.where('id_tfg', '==', this.id_tfg).orderBy('timestamp')
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map((messages) => {
          console.debug('[DEBUG] Mensajes cargados:', messages);

          if (this.isChatActive) {
            this.checkUnreadMessages(messages);
          }

          return messages.map((message) => ({
            ...message,
            timestamp: this.convertToDate(message.timestamp), // Convertir a Date
          }));
        }),
        catchError((err) => {
          console.error('[ERROR] Error al cargar los mensajes:', err);
          return of([]);
        })
      );
  }

  private startMessageCheck() {
    this.checkMessagesInterval = setInterval(() => {
      if (this.isChatActive) {
        this.messages$.subscribe((messages) => {
          this.checkUnreadMessages(messages);
        });
      }
    }, 5000); // Comprobar cada 5 segundos
  }

  private checkUnreadMessages(messages: Chat[]) {
    if (!this.isChatActive) {
      console.debug('[DEBUG] Chat no activo. No se procesan mensajes.');
      return;
    }

    const unreadMessages = messages.filter((message) => {
      const isUnread = !message.read;
      const isFromTutor = message.sender_type === 'tutor'; // Solo mensajes del tutor

      console.debug('[DEBUG] Mensaje evaluado:', {
        id: message.id,
        isUnread,
        isFromTutor,
      });

      return isUnread && isFromTutor;
    });

    if (unreadMessages.length > 0) {
      this.markMessagesAsRead(unreadMessages);
    } else {
      console.debug('[DEBUG] No hay mensajes no leídos para marcar.');
    }
  }

  private markMessagesAsRead(messages: Chat[]) {
    if (!this.isChatActive) {
      console.debug('[DEBUG] Chat no activo. No se marcan mensajes.');
      return;
    }

    const batch = this.firestore.firestore.batch();
    messages.forEach((message: any) => {
      const messageDocRef = this.firestore.firestore.collection('chat').doc(message.id);
      batch.update(messageDocRef, { read: true });
    });

    batch
      .commit()
      .then(() => {
        console.debug('[DEBUG] Mensajes marcados como leídos.');
      })
      .catch((err) => {
        console.error('[ERROR] Error al marcar mensajes como leídos:', err);
      });
  }

  private convertToDate(timestamp: any): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    } else if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    } else {
      return new Date(0); // Fecha inválida para manejar errores
    }
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      const messageData: Chat = {
        id: '',
        id_estudiante: this.id_estudiante,
        id_tfg: this.id_tfg,
        id_tutor: this.id_tutor,
        message: this.newMessage,
        sender_type: 'estudiante',
        timestamp: new Date(),
        read: false,
      };

      console.debug('[DEBUG] Enviando mensaje:', messageData);

      this.firestore
        .collection('chat')
        .add(messageData)
        .then(() => {
          this.newMessage = '';
        })
        .catch((err) => {
          console.error('[ERROR] Error al enviar el mensaje:', err);
        });
    }
  }
  private fetchNotaEstudiante() {
    if (!this.id_estudiante) {
      console.warn('[WARN] ID del estudiante no definido.');
      return;
    }
  
    console.log('[DEBUG] Buscando nota para el estudiante con ID:', this.id_estudiante);
  
    this.firestore
      .collection('tfg', (ref) => ref.where('id_estudiante', '==', this.id_estudiante).limit(1))
      .get()
      .subscribe(
        (tfgSnapshot) => {
          if (!tfgSnapshot.empty) {
            const tfg = tfgSnapshot.docs[0].data() as any;
            console.log('[DEBUG] Documento TFG encontrado:', tfg);
  
            if ('nota' in tfg) {
              this.notaEstudiante = tfg.nota;
              console.log('[DEBUG] Nota encontrada:', this.notaEstudiante);
            } else {
              console.warn('[WARN] El campo "nota" no está presente en el documento TFG.');
              this.notaEstudiante = 'Sin nota disponible';
            }
          } else {
            console.warn('[WARN] No se encontró un documento TFG para el estudiante.');
            this.notaEstudiante = 'Sin nota disponible';
          }
        },
        (err) => {
          console.error('[ERROR] Error al obtener la nota del estudiante:', err);
          this.notaEstudiante = 'Error al cargar la nota';
        }
      );
  }
  
}
