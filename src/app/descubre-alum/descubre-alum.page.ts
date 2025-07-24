import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { lastValueFrom } from 'rxjs';

interface Estudiante {
  id_estudiante: number;
  nombre: string;
  titulacion: string;
  password: string;
}

interface Tfg {
  id_tfg: number;
  titulo: string;
  descripcion: string;
  // ... resto de campos
  id_tutor: number;
  id_estudiante: number | null;
}

interface Tutor {
  id_tutor: number;
  nombre: string;
  password: string;
}

interface Match {
  id_estudiante: number;
  id_tfg: number;
  aceptar: number;
  id_tutor: number;
}

@Component({
  selector: 'app-descubre',
  templateUrl: './descubre-alum.page.html',
  styleUrls: ['./descubre-alum.page.scss'],
})
export class DescubreAlumPage implements OnInit {
  estudianteTitulacion: string = '';
  profesores: Tutor[] = [];
  allTfgs: Tfg[] = [];
  tfgs: Tfg[] = [];
  likedTfgs: { [id_tfg: number]: boolean } = {};
  currentProfesorIndex: number = 0;
  estudianteId: number | null = null;
  tieneTfgAsignado: boolean = false;

  // Datos del profesor actual
  currentProfesorName: string = '';
  currentProfesorImage: string = 'assets/sample-image.png';

  // Datos del siguiente profesor
  nextProfesorIndex: number = 0;
  nextProfesorName: string = '';
  nextProfesorImage: string = 'assets/sample-image.png';
  nextTfgs: Tfg[] = [];

  // Swipe
  private startX: number = 0;
  private currentX: number = 0;
  private isSwiping: boolean = false;
  
  // Transformaciones
  cardTransform: string = 'translateX(-50%)'; // Base centrar la carta actual
  cardTransition: string = 'none';

  nextCardTransform: string = 'translateX(-50%) translateY(20px) scale(0.95)';
  nextCardOpacity: string = '0';

  constructor(private firestore: AngularFirestore) {}

  async ngOnInit() {
    this.adjustScrollHeight();
    const estudianteNombre = localStorage.getItem('nombre_estudiante');
    if (!estudianteNombre) {
      console.error('No se encontró un estudiante logueado.');
      return;
    }

    try {
      const estudianteSnapshot = await lastValueFrom(
        this.firestore
          .collection<Estudiante>('estudiante', ref =>
            ref.where('nombre', '==', estudianteNombre)
          )
          .get()
      );

      if (!estudianteSnapshot.empty) {
        const estudianteData = estudianteSnapshot.docs[0].data();
        this.estudianteTitulacion = estudianteData.titulacion;
        this.estudianteId = estudianteData.id_estudiante;

        const tfgAsignadoSnapshot = await lastValueFrom(
          this.firestore
            .collection<Tfg>('tfg', ref =>
              ref.where('id_estudiante', '==', this.estudianteId!)
            )
            .get()
        );

        if (!tfgAsignadoSnapshot.empty) {
          this.tieneTfgAsignado = true;
          return;
        }

        const tfgsSnapshot = await lastValueFrom(
          this.firestore
            .collection<Tfg>('tfg', ref =>
              ref
                .where('titulacion', '==', this.estudianteTitulacion)
                .where('id_estudiante', '==', null)
            )
            .get()
        );

        if (!tfgsSnapshot.empty) {
          this.allTfgs = tfgsSnapshot.docs.map(doc => doc.data() as Tfg);

          const tutorIds = [...new Set(this.allTfgs.map(tfg => tfg.id_tutor))];
          const profesoresSnapshot = await lastValueFrom(
            this.firestore
              .collection<Tutor>('tutor', ref =>
                ref.where('id_tutor', 'in', tutorIds)
              )
              .get()
          );

          this.profesores = profesoresSnapshot.docs.map(doc =>
            doc.data()
          ) as Tutor[];

          this.loadCurrentAndNext();
        } else {
          console.warn('No se encontraron TFGs disponibles.');
        }
      } else {
        console.error('Estudiante no encontrado.');
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }

  loadCurrentAndNext() {
    if (this.profesores.length === 0) return;
    const currentProfesor = this.profesores[this.currentProfesorIndex];
    this.currentProfesorName = currentProfesor.nombre || 'Cargando...';
    this.tfgs = this.allTfgs.filter(tfg => tfg.id_tutor === currentProfesor.id_tutor);

    if (this.profesores.length > 1) {
      this.nextProfesorIndex = (this.currentProfesorIndex + 1) % this.profesores.length;
      const nextProfesor = this.profesores[this.nextProfesorIndex];
      this.nextProfesorName = nextProfesor.nombre || 'Cargando...';
      this.nextTfgs = this.allTfgs.filter(tfg => tfg.id_tutor === nextProfesor.id_tutor);
      this.nextProfesorImage = 'assets/sample-image.png';
    } else {
      this.nextProfesorName = '';
      this.nextTfgs = [];
    }
    this.adjustScrollHeight();
 

    // Reset transform
    this.cardTransform = 'translateX(-50%) rotate(0deg)';
    this.cardTransition = 'none';
    this.nextCardTransform = 'translateX(-50%) translateY(20px) scale(0.95)';
    this.nextCardOpacity = '0';
  }
  

  async toggleCorazon(tfg: Tfg) {
    this.likedTfgs[tfg.id_tfg] = !this.likedTfgs[tfg.id_tfg];
    if (this.likedTfgs[tfg.id_tfg]) {
      const match: Match = {
        id_estudiante: this.estudianteId!,
        id_tfg: tfg.id_tfg,
        aceptar: 3,
        id_tutor: tfg.id_tutor,
      };
      try {
        await this.firestore.collection<Match>('match').add(match);
      } catch (error) {
        console.error('Error al guardar el Match:', error);
      }
    }
  }

  onTouchStart(event: TouchEvent) {
    // Verificamos si el toque se produjo en el botón del corazón
    const target = event.target as HTMLElement;
    if (target.closest('.corazon-button')) {
      // Si es así, no iniciamos el swipe
      return;
    }
  
    this.startX = event.changedTouches[0].clientX;
    this.isSwiping = true;
    this.cardTransition = 'none';
  }
  

  onTouchMove(event: TouchEvent) {
    if (!this.isSwiping) return;
    this.currentX = event.changedTouches[0].clientX - this.startX;

    const rotateDeg = this.currentX * 0.05;
    // Aplicamos siempre el translateX(-50%) base + el movimiento actual
    this.cardTransform = `translateX(-50%) translateX(${this.currentX}px) rotate(${rotateDeg}deg)`;

    // Mostrar gradualmente la siguiente carta
    const absX = Math.abs(this.currentX);
    if (this.nextProfesorName) {
      if (absX > 10) {
        const opacity = Math.min(absX / 100, 1);
        this.nextCardOpacity = opacity.toString();
        const translateY = 20 - (absX * 0.1);
        const scale = 0.95 + Math.min(absX / 1000, 0.05);
        this.nextCardTransform = `translateX(-50%) translateY(${Math.max(0, translateY)}px) scale(${scale})`;
      } else {
        this.nextCardOpacity = '0';
        this.nextCardTransform = 'translateX(-50%) translateY(20px) scale(0.95)';
      }
    }
  }

  onTouchEnd() {
    if (!this.isSwiping) return;
    this.isSwiping = false;

    const threshold = 50;
    if (Math.abs(this.currentX) > threshold) {
      // Descartar la carta
      const direction = this.currentX > 0 ? 1 : -1;
      this.cardTransition = 'transform 0.3s ease-out';
      this.cardTransform = `translateX(-50%) translateX(${direction * 1000}px) rotate(${direction * 30}deg)`;

      setTimeout(() => {
        this.currentProfesorIndex = this.nextProfesorIndex;
        this.loadCurrentAndNext();
      }, 300);
    } else {
      // Volver al centro
      this.cardTransition = 'transform 0.3s ease-out';
      this.cardTransform = `translateX(-50%) rotate(0deg)`;
      this.nextCardOpacity = '0';
      this.nextCardTransform = 'translateX(-50%) translateY(20px) scale(0.95)';
    }
  }

  trackById(index: number, tfg: Tfg): number {
    return tfg.id_tfg;
  }
  adjustScrollHeight() {
    const ionContent = document.querySelector('ion-content') as HTMLElement;
    if (ionContent) {
      const scrollableContent = ionContent.querySelector('.scrollable-content') as HTMLElement;
      if (scrollableContent) {
        scrollableContent.style.paddingBottom = '120px'; // Espacio para el contenedor de íconos
      }
    }
  }
  
  
}

