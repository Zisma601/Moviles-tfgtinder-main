import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

interface Estudiante {
  id_estudiante: number;
  nombre: string;
  titulacion: string;
}

interface Tfg {
  id: string;
  titulo: string;
  descripcion: string;
  tfg_estado: string;
  nota: number | null;
  id_estudiante: number;
}

@Component({
  selector: 'app-perfil-alum',
  templateUrl: './perfil-alum.page.html',
  styleUrls: ['./perfil-alum.page.scss'],
})
export class PerfilAlumPage implements OnInit {
  estudiante$: Observable<Estudiante | null> = of(null); // Observable para el estudiante
  tfgs$: Observable<Tfg[] | null> = of(null); // Observable para los TFGs
  private tfgsSubject = new BehaviorSubject<Tfg[]>([]); // Subject para cambios dinámicos de TFGs

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    const nombreEstudiante = localStorage.getItem('nombre_estudiante');
    if (nombreEstudiante) {
      this.estudiante$ = this.firestore
        .collection('estudiante', ref => ref.where('nombre', '==', nombreEstudiante))
        .get()
        .pipe(
          map(snapshot => {
            if (!snapshot || snapshot.empty) {
              console.warn('[WARN] No se encontró ningún estudiante con el nombre:', nombreEstudiante);
              return null;
            }
            const estudiante = snapshot.docs[0].data() as Estudiante;
            console.log('[LOG] Estudiante encontrado:', estudiante);
            return estudiante;
          }),
          catchError(err => {
            console.error('[ERROR] Error al cargar el estudiante:', err);
            return of(null);
          })
        );

      this.tfgs$ = this.estudiante$.pipe(
        switchMap(estudiante => {
          if (!estudiante) return of(null);
          console.log('[LOG] Buscando TFGs para el estudiante con ID:', estudiante.id_estudiante);
          return this.firestore
            .collection('tfg', ref => ref.where('id_estudiante', '==', estudiante.id_estudiante))
            .get();
        }),
        map(snapshot => {
          if (!snapshot || snapshot.empty) {
            console.warn('[WARN] No se encontraron TFGs.');
            return null;
          }
          const tfgs = snapshot.docs.map(doc => {
            const data = doc.data() as Tfg;
            data.id = doc.id; // Agregar el ID del documento
            return data;
          });
          console.log('[LOG] TFGs encontrados:', tfgs);
          this.tfgsSubject.next(tfgs); // Actualizar el subject con los datos iniciales
          return tfgs;
        }),
        catchError(err => {
          console.error('[ERROR] Error al cargar los TFGs:', err);
          return of(null);
        })
      );
    } else {
      console.warn('[WARN] No se encontró el nombre del estudiante en localStorage.');
    }
  }

  getStatusBarWidth(estado: string): string {
    console.log('Estado actual del TFG:', estado); // Depuración
    if (estado === 'En curso') {
      return '50%';
    } else if (estado === 'Terminado' || estado === 'Evaluado') {
      return '90%';
    }
    return '0%';
  }

  cambiarEstadoTfg(id: string, nuevoEstado: string): void {
    console.log(`[LOG] Cambiando estado del TFG con ID: ${id} a ${nuevoEstado}`);
    const tfgs = this.tfgsSubject.value.map(tfg =>
      tfg.id === id ? { ...tfg, tfg_estado: nuevoEstado } : tfg
    );
    this.tfgsSubject.next(tfgs); // Actualizar el Subject

    // Opcional: Actualizar en Firestore
    this.firestore
      .collection('tfg')
      .doc(id)
      .update({ tfg_estado: nuevoEstado })
      .then(() => console.log('[LOG] Estado actualizado en Firestore'))
      .catch(err => console.error('[ERROR] No se pudo actualizar el estado en Firestore:', err));
  }

  get tfgsObservable(): Observable<Tfg[]> {
    return this.tfgsSubject.asObservable(); // Exponer los cambios como un Observable
  }
}
