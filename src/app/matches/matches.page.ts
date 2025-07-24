import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs/operators';

interface Match {
  id_estudiante: number;
  id_tfg: number;
  aceptar: number;
  id_tutor?: number;
  docId?: string; // Agregar el docId opcional
  titulo?: string; // Campo opcional para vincular el título del TFG
}


interface Estudiante {
  id_estudiante: number;
  nombre: string;
  titulacion: string;
  password: string;
}

@Component({
  selector: 'app-matches',
  templateUrl: './matches.page.html',
  styleUrls: ['./matches.page.scss'],
})
export class MatchesPage implements OnInit {
  matches: Match[] = [];
  estudiantes: { [key: number]: Estudiante } = {}; // Mapa de estudiantes
  idTutor: number = 0; // Almacenará el ID del tutor logueado

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    console.log('Inicializando MatchesPage...');
    this.obtenerIdTutor();
    this.obtenerMatches();
  }

  obtenerIdTutor() {
    const idTutorString = localStorage.getItem('id_tutor');
    if (idTutorString) {
      this.idTutor = parseInt(idTutorString, 10); // Convertir a número
      console.log('ID del tutor logueado:', this.idTutor);
    } else {
      console.error('No se encontró un ID de tutor en el localStorage.');
    }
  }

  obtenerMatches() {
    console.log('Obteniendo matches para el tutor con ID:', this.idTutor);
  
    this.firestore
      .collection('match', (ref) =>
        ref.where('aceptar', '==', 3).where('id_tutor', '==', this.idTutor)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Match;
            const docId = a.payload.doc.id;
            return { ...data, docId };
          })
        )
      )
      .subscribe({
        next: (matches) => {
          console.log('Matches obtenidos:', matches);
          this.matches = matches;
  
          if (matches.length === 0) {
            console.warn('No se encontraron matches para los criterios especificados.');
          } else {
            // Cargar los títulos de los TFGs asociados a los matches
            this.cargarTfgTitulos(matches);
  
            // Cargar los estudiantes asociados a los matches
            this.cargarEstudiantes(matches);
          }
        },
        error: (error) => {
          console.error('Error al obtener matches:', error);
        },
      });
  }
  
  cargarTfgTitulos(matches: Match[]) {
    const tfgIds = matches.map((match) => match.id_tfg);
    console.log('IDs de TFGs a cargar:', tfgIds);
  
    this.firestore
      .collection('tfg', (ref) => ref.where('id_tfg', 'in', tfgIds))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as { id_tfg: number; titulo: string }; // Conversión explícita
            const idTfg = data.id_tfg;
            const titulo = data.titulo;
            return { idTfg, titulo };
          })
        )
      )
      .subscribe({
        next: (tfgs) => {
          console.log('Títulos de TFGs cargados:', tfgs);
  
          // Vincular los títulos al array de matches
          this.matches = this.matches.map((match) => {
            const tfg = tfgs.find((t) => t.idTfg === match.id_tfg);
            return { ...match, titulo: tfg?.titulo || 'Título no disponible' };
          });
  
          console.log('Matches con títulos actualizados:', this.matches);
        },
        error: (error) => {
          console.error('Error al cargar títulos de TFGs:', error);
        },
      });
  }
  
  

  cargarEstudiantes(matches: Match[]) {
    const estudiantesIds = matches.map((match) => match.id_estudiante);
    console.log('IDs de estudiantes a cargar:', estudiantesIds);

    if (estudiantesIds.length === 0) {
      console.warn('No hay IDs de estudiantes para cargar.');
      return;
    }

    this.firestore
      .collection('estudiante', (ref) =>
        ref.where('id_estudiante', 'in', estudiantesIds)
      )
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Estudiante;
            console.log('Estudiante obtenido desde Firestore:', data);
            return data;
          })
        )
      )
      .subscribe({
        next: (estudiantes) => {
          estudiantes.forEach((estudiante) => {
            this.estudiantes[estudiante.id_estudiante] = estudiante;
          });
          console.log('Mapa de estudiantes cargado:', this.estudiantes);
        },
        error: (error) => {
          console.error('Error al cargar estudiantes:', error);
        },
      });
  }

  aceptarMatch(idEstudiante: number, idTfg: number) {
    console.log('Intentando aceptar match:', { idEstudiante, idTfg });
    const match = this.matches.find(
      (m) => m.id_estudiante === idEstudiante && m.id_tfg === idTfg
    );
  
    if (match && match.docId) {
      console.log('Match encontrado, aceptando:', match);
  
      // Actualizar el campo aceptar en el match actual
      this.firestore
        .collection('match')
        .doc(match.docId)
        .update({ aceptar: 1 })
        .then(() => {
          console.log('Match aceptado correctamente.');
  
          // Actualizar los datos en la tabla TFG
          this.actualizarTfg(idTfg, idEstudiante);
  
          // Actualizar los demás matches del mismo estudiante y tutor
          this.actualizarOtrosMatches(idEstudiante);
        })
        .catch((error) => {
          console.error('Error al aceptar el match:', error);
        });
    } else {
      console.error('No se encontró el match especificado para aceptar.');
    }
  }

  actualizarOtrosMatches(idEstudiante: number) {
    console.log('Actualizando otros matches del estudiante:', idEstudiante);
  
    this.firestore
      .collection('match', (ref) =>
        ref
          .where('id_estudiante', '==', idEstudiante)
          .where('id_tutor', '==', this.idTutor)
          .where('aceptar', '==', 3) // Solo los pendientes
      )
      .get()
      .subscribe({
        next: (querySnapshot) => {
          if (querySnapshot.empty) {
            console.log('No hay otros matches para actualizar.');
            return;
          }
  
          querySnapshot.forEach((doc) => {
            console.log(`Actualizando match con ID: ${doc.id} a aceptar: 4`);
            this.firestore
              .collection('match')
              .doc(doc.id)
              .update({ aceptar: 4 })
              .then(() => {
                console.log(`Match con ID: ${doc.id} actualizado correctamente.`);
              })
              .catch((error) => {
                console.error(`Error al actualizar match con ID: ${doc.id}:`, error);
              });
          });
        },
        error: (error) => {
          console.error('Error al obtener otros matches:', error);
        },
      });
  }

  actualizarTfg(idTfg: number, idEstudiante: number) {
    console.log('Buscando documento en TFG con id_tfg:', idTfg);
  
    const fechaInicio = new Date().toISOString(); // Fecha actual en formato ISO
  
    // Buscar el documento en la colección 'tfg' donde el campo 'id_tfg' coincida
    this.firestore
      .collection('tfg', (ref) => ref.where('id_tfg', '==', idTfg))
      .get()
      .subscribe({
        next: (querySnapshot) => {
          if (querySnapshot.empty) {
            console.warn(`No se encontró ningún documento en 'tfg' con id_tfg: ${idTfg}`);
            return;
          }
  
          // Actualizar todos los documentos que coincidan
          querySnapshot.forEach((doc) => {
            console.log(`Documento TFG encontrado con ID: ${doc.id}`);
            this.firestore
              .collection('tfg')
              .doc(doc.id)
              .update({
                fecha_inicio: fechaInicio,
                id_estudiante: idEstudiante,
                tfg_estado: 'En curso',
              })
              .then(() => {
                console.log('TFG actualizado correctamente:', {
                  fecha_inicio: fechaInicio,
                  id_estudiante: idEstudiante,
                  tfg_estado: 'En curso',
                });
              })
              .catch((error) => {
                console.error('Error al actualizar el TFG:', error);
              });
          });
        },
        error: (error) => {
          console.error('Error al buscar documentos en la colección TFG:', error);
        },
      });
  }

  rechazarMatch(idEstudiante: number, idTfg: number) {
    console.log('Intentando rechazar match:', { idEstudiante, idTfg });
    const match = this.matches.find(
      (m) => m.id_estudiante === idEstudiante && m.id_tfg === idTfg
    );

    if (match && match.docId) {
      console.log('Match encontrado, rechazando:', match);

      // Actualizar el campo aceptar en la colección match
      this.firestore
        .collection('match')
        .doc(match.docId)
        .update({ aceptar: 0 })
        .then(() => {
          console.log('Match rechazado correctamente.');
        })
        .catch((error) => {
          console.error('Error al rechazar el match:', error);
        });
    } else {
      console.error('No se encontró el match especificado para rechazar.');
    }
  }
  getEmailEstudiante(idEstudiante: number): string {
    const estudiante = this.estudiantes[idEstudiante]; // Acceder directamente al objeto con el ID
    if (!estudiante) {
      console.warn(`No se encontró información para el estudiante con ID: ${idEstudiante}`);
      return 'Email no disponible';
    }
  
    // Función para eliminar acentos y caracteres especiales
    const eliminarAcentos = (texto: string): string =>
      texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
    // Procesar el nombre del estudiante
    const nombreProcesado = eliminarAcentos(estudiante.nombre)
      .toLowerCase()          // Convertir todo a minúsculas
      .replace(/\s+/g, '')    // Eliminar espacios en blanco
      .replace(/[^a-z0-9]/g, ''); // Eliminar caracteres no válidos
  
    const email = `${nombreProcesado}@gmail.com`;
  
    console.log(`Generando email para el estudiante con ID: ${idEstudiante} -> ${email}`);
    return email;
  }
  
  
}
