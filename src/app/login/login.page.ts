import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

// Definir las interfaces
interface Student {
  id_estudiante: number;
  nombre: string;
  password: string;
}

interface Tutor {
  id_tutor: number;
  nombre: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',  // Ruta correcta al archivo HTML
  styleUrls: ['./login.page.scss'],  // Ruta correcta al archivo SCSS
})
export class LoginPage {
  nombre: string = '';  // Campo para el nombre
  password: string = '';  // Campo para la contraseña

  constructor(
    private firestore: AngularFirestore,
    private router: Router
  ) {}

  async login() {
    if (!this.nombre.trim() || !this.password) {
      alert('Por favor, ingresa tanto el nombre como la contraseña.');
      return;
    }
  
    try {
      const trimmedName = this.nombre.trim();
  
      // Buscar en la colección "estudiante"
      const studentDoc = await lastValueFrom(
        this.firestore
          .collection('estudiante', ref => ref.where('nombre', '==', trimmedName))
          .get()
      );
  
      if (!studentDoc.empty) {  // Verificamos si hay resultados
        const student = studentDoc.docs[0].data() as Student;
  
        if (student.password === this.password) {
          localStorage.setItem('nombre_estudiante', student.nombre);
          this.router.navigate(['/descubre-alum']); // Redirigir a la página de estudiante
        } else {
          alert('Contraseña incorrecta.');
        }
      } else {
        // Si no se encuentra un estudiante, buscar al tutor
        const tutorDoc = await lastValueFrom(
          this.firestore
            .collection('tutor', ref => ref.where('nombre', '==', trimmedName))
            .get()
        );
  
        if (!tutorDoc.empty) {
          const tutor = tutorDoc.docs[0].data() as Tutor;
          if (tutor.password === this.password) {
            localStorage.setItem('id_tutor', tutor.id_tutor.toString());
            this.router.navigate(['/tfg-prof']); // Redirigir a la página de tutor
          } else {
            alert('Contraseña incorrecta.');
          }
        } else {
          alert('Nombre no encontrado o contraseña incorrecta.');
        }
      }
    } catch (error) {
      console.error('Error al intentar iniciar sesión:', error);
      alert('Hubo un error al intentar iniciar sesión.');
    }
  }
  
}
