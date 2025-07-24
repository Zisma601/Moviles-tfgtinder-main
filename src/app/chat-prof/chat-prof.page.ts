import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';
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
  selector: 'app-chat-prof',
  templateUrl: './chat-prof.page.html',
  styleUrls: ['./chat-prof.page.scss'],
})
export class ChatProfPage implements OnInit, OnDestroy {
  estudianteName: string = '';
  startDate: string = '';
  endDate: string = '';
  messages$: Observable<Chat[]> = of([]);
  newMessage: string = '';
  id_tfg: number = 0;
  id_estudiante: number = 0;
  id_tutor: number = 0;
  private subscriptions: Subscription = new Subscription();
  private isActive: boolean = false; // Indica si la ventana está activa
  private isChatActive: boolean = true; // Indica si el usuario está dentro del chat
  private entryTime: number = 0; // Tiempo de entrada al chat en milisegundos
  private checkMessagesInterval: any; // Intervalo para comprobar mensajes
  notaEstudiante: string = '';

  constructor(
    private firestore: AngularFirestore,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.isChatActive = true; // Marcar el chat como activo al entrar
    this.entryTime = new Date().getTime(); // Registrar tiempo de entrada

    // Obtener parámetros de la ruta
    this.estudianteName = this.route.snapshot.queryParamMap.get('estudianteName') || '';
    this.startDate = this.route.snapshot.queryParamMap.get('startDate') || '';
    this.endDate = this.route.snapshot.queryParamMap.get('endDate') || '';
    this.id_tfg = Number(this.route.snapshot.queryParamMap.get('id_tfg'));
    this.id_estudiante = Number(this.route.snapshot.queryParamMap.get('id_estudiante'));
    console.log('[DEBUG] Parámetros recibidos en chat-prof:', {
      estudianteName: this.estudianteName,
      id_tfg: this.id_tfg,
      id_estudiante: this.id_estudiante,
    });
    this.id_tutor = Number(localStorage.getItem('id_tutor'));

    if (this.id_tfg) {
      this.loadMessages();
      this.fetchNotaEstudiante();
    } else {
      console.warn('[WARN] No se encontró el TFG asociado.');
    }

    this.startMessageCheck();
  }

  ngOnDestroy() {
    this.isChatActive = false; // Marcar el chat como inactivo al salir
    this.isActive = false; // Desactivar la ventana al destruir el componente
    clearInterval(this.checkMessagesInterval); // Detener el intervalo de comprobación
    this.subscriptions.unsubscribe(); // Cancelar suscripciones
  }

  @HostListener('window:focus', ['$event'])
  onFocus() {
    this.isActive = true;
    console.log('[DEBUG] Ventana activa.');
  }

  @HostListener('window:blur', ['$event'])
  onBlur() {
    this.isActive = false;
    console.log('[DEBUG] Ventana inactiva.');
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

          const now = new Date();
          if (this.isChatActive && this.isActive) {
            this.checkUnreadMessages(messages, now);
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
      if (this.isChatActive && this.isActive) {
        this.messages$.subscribe((messages) => {
          const now = new Date();
          this.checkUnreadMessages(messages, now);
        });
      }
    }, 5000); // Comprobar cada 5 segundos
  }

  private checkUnreadMessages(messages: Chat[], now: Date) {
    if (!this.isChatActive || !this.isActive) {
      // No procesar mensajes si el chat no está activo o la ventana no está activa
      console.debug('[DEBUG] Chat no activo o ventana inactiva. No se verifican mensajes.');
      return;
    }

    const unreadMessages = messages.filter((message) => {
      const messageTime = this.convertToDate(message.timestamp);
      const isUnread = !message.read;
      const isFromSender = message.sender_type !== this.getSenderType();
      const isBeforeNow = this.isBeforeNow(messageTime, now);

      console.debug('[DEBUG] Mensaje evaluado:', {
        id: message.id,
        messageTime,
        now,
        isUnread,
        isFromSender,
        isBeforeNow,
      });

      return isUnread && isFromSender && isBeforeNow;
    });

    if (unreadMessages.length > 0) {
      this.markMessagesAsRead(unreadMessages);
    } else {
      console.debug('[DEBUG] No hay mensajes no leídos para marcar.');
    }
  }

  private markMessagesAsRead(messages: Chat[]) {
    console.debug('[DEBUG] Intentando marcar mensajes como leídos...');
    if (!this.isChatActive || !this.isActive) {
      console.debug('[DEBUG] Chat no activo o ventana inactiva. No se marcan mensajes.');
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

  private isBeforeNow(messageTime: Date, now: Date): boolean {
    return (
      messageTime.getFullYear() <= now.getFullYear() &&
      messageTime.getMonth() <= now.getMonth() &&
      messageTime.getDate() <= now.getDate() &&
      messageTime.getHours() <= now.getHours() &&
      messageTime.getMinutes() <= now.getMinutes()
    );
  }

  private getSenderType(): string {
    return 'tutor';
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      const messageData: Chat = {
        id: '',
        id_estudiante: this.id_estudiante,
        id_tfg: this.id_tfg,
        id_tutor: this.id_tutor,
        message: this.newMessage,
        sender_type: 'tutor',
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
      this.notaEstudiante = 'Sin nota disponible';
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
