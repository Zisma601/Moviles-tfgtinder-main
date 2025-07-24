import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router'; // Importar Router
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';

interface Estudiante {
  id_estudiante: number;
  nombre: string;
  password: string;
  titulacion: string;
}

interface Tfg {
  titulo: string;
  descripcion: string;
  tfg_estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  id_tutor: number;
  id_tfg: number;
  id_estudiante: number;
}

interface Chat {
  id_estudiante: number;
  id_tfg: number;
  id_tutor: number;
  read: boolean;
  sender_type: string; // 'tutor' o 'estudiante'
}

interface Match {
  id_estudiante: number;
  id_tutor: number;
  id_tfg: number;
  aceptar: number;
}

@Component({
  selector: 'app-msg-prof',
  templateUrl: './msg-prof.page.html',
  styleUrls: ['./msg-prof.page.scss'],
})
export class MsgProfPage implements OnInit, OnDestroy {
  estudiantes: Estudiante[] = [];
  estudiantesOriginales: Estudiante[] = [];
  tfgData: { [key: number]: Tfg } = {};
  unreadMessages: { [key: number]: boolean } = {}; // Control de mensajes no leídos por estudiante
  selectedFilter: string = 'Todos';
  isDropdownVisible: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private firestore: AngularFirestore,
    private router: Router, // Inyectar Router
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('[DEBUG] Iniciando carga de matches...');
    this.loadMatches();
  }

  ngOnDestroy() {
    console.log('[DEBUG] Destruyendo componente msg-prof.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMatches() {
    const idTutor = localStorage.getItem('id_tutor');
    if (idTutor) {
      console.log('[DEBUG] Cargando matches para id_tutor:', idTutor);

      this.firestore
        .collection('match', (ref) => ref.where('id_tutor', '==', +idTutor).where('aceptar', '==', 1))
        .get()
        .pipe(
          takeUntil(this.destroy$),
          map((snapshot) => {
            if (snapshot.empty) {
              console.warn('[WARN] No se encontraron matches.');
              return [];
            }
            return snapshot.docs.map((doc) => doc.data() as Match);
          })
        )
        .subscribe((matches) => {
          console.log('[DEBUG] Matches encontrados:', matches);
          if (matches.length > 0) {
            this.loadEstudiantes(matches);
          }
        });
    } else {
      console.error('[ERROR] No se encontró id_tutor en localStorage.');
    }
  }

  private loadEstudiantes(matches: Match[]) {
    const estudianteIds = matches.map((match) => match.id_estudiante);

    console.log('[DEBUG] Cargando estudiantes para ids:', estudianteIds);

    this.estudiantes = [];
    this.estudiantesOriginales = [];
    this.tfgData = {};

    estudianteIds.forEach((id) => {
      this.firestore
        .collection('estudiante', (ref) => ref.where('id_estudiante', '==', id))
        .get()
        .pipe(takeUntil(this.destroy$))
        .subscribe((snapshot) => {
          if (!snapshot.empty) {
            const estudiante = snapshot.docs[0].data() as Estudiante;
            console.log('[DEBUG] Estudiante cargado:', estudiante);
            this.estudiantes.push(estudiante);
            this.estudiantesOriginales.push(estudiante);
            this.loadTfgData(estudiante);
            this.checkUnreadMessages(estudiante.id_estudiante);
          } else {
            console.warn('[WARN] No se encontró estudiante con id_estudiante:', id);
          }
        });
    });
  }

  private loadTfgData(estudiante: Estudiante) {
    console.log('[DEBUG] Cargando TFG para id_estudiante:', estudiante.id_estudiante);

    this.firestore
      .collection('tfg', (ref) => ref.where('id_estudiante', '==', estudiante.id_estudiante))
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe((tfgDoc) => {
        if (!tfgDoc.empty) {
          const tfgData = tfgDoc.docs[0].data() as Tfg;
          console.log('[DEBUG] TFG cargado:', tfgData);
          this.tfgData[estudiante.id_estudiante] = tfgData;
        } else {
          console.warn('[WARN] No se encontró TFG para id_estudiante:', estudiante.id_estudiante);
        }
      });
  }

  private checkUnreadMessages(id_estudiante: number) {
    this.firestore
      .collection<Chat>('chat', (ref) =>
        ref
          .where('id_estudiante', '==', id_estudiante)
          .where('read', '==', false)
          .where('sender_type', '==', 'estudiante') // Solo mensajes enviados por el estudiante
      )
      .valueChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages) => {
        this.unreadMessages[id_estudiante] = messages.length > 0; // Actualiza si tiene mensajes no leídos
        console.log(`[DEBUG] Mensajes no leídos para id_estudiante=${id_estudiante}:`, messages);
        this.cdr.detectChanges(); // Detectar cambios para actualizar la vista
      });
  }
  

  navigateToChat(estudiante: Estudiante) {
    const tfg = this.tfgData[estudiante.id_estudiante];
    if (tfg) {
      console.log('[DEBUG] Navegando a chat con datos:', {
        estudianteName: estudiante.nombre,
        id_tfg: tfg.id_tfg,
        id_estudiante: estudiante.id_estudiante,
      });
      this.router.navigate(['/chat-prof'], {
        queryParams: {
          estudianteName: estudiante.nombre,
          id_tfg: tfg.id_tfg,
          id_estudiante: estudiante.id_estudiante, // Verifica que este valor sea correcto
          startDate: tfg.fecha_inicio,
          endDate: tfg.fecha_fin,
        },
      });
    } else {
      console.warn('[WARN] No se encontró TFG para estudiante:', estudiante);
    }
  }

  filterEstudiantes() {
    console.log('[DEBUG] Filtrando estudiantes por estado:', this.selectedFilter);

    const estudiantesFiltrados = this.estudiantesOriginales.filter((estudiante) => {
      const tfg = this.tfgData[estudiante.id_estudiante];
      return this.selectedFilter === 'Todos' || tfg?.tfg_estado === this.selectedFilter;
    });

    this.estudiantes = estudiantesFiltrados;
    this.cdr.detectChanges();
  }

  toggleDropdown() {
    console.log('[DEBUG] Alternando visibilidad del dropdown.');
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  closeDropdown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const filterButton = document.getElementById('filterButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (
      filterButton &&
      !filterButton.contains(target) &&
      dropdownMenu &&
      !dropdownMenu.contains(target)
    ) {
      this.isDropdownVisible = false;
      console.log('[DEBUG] Cerrando dropdown.');
    }
  }
  convertirNombreAGmail(nombre: string): string {
    // Eliminar acentos y caracteres especiales
    const eliminarAcentos = (texto: string): string =>
      texto
        .normalize("NFD") // Normaliza y separa letras de acentos
        .replace(/[\u0300-\u036f]/g, ""); // Elimina los acentos
  
    // Procesar el nombre: eliminar acentos, minúsculas y sin espacios
    const nombreProcesado = eliminarAcentos(nombre)
      .toLowerCase() // Convertir todo a minúsculas
      .replace(/\s+/g, ""); // Eliminar todos los espacios
  
    // Retornar el email final
    return `${nombreProcesado}@gmail.com`;
  }
  onFilterSelect(filter: string) {
    console.log('[DEBUG] Filtro seleccionado:', filter);
  
    // Actualizar el filtro seleccionado y cerrar el dropdown
    this.selectedFilter = filter;
    this.filterEstudiantes(); // Aplicar el filtro
    this.isDropdownVisible = false; // Cerrar el dropdown
  }

}
