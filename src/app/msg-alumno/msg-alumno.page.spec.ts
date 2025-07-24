import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-msg-alumno',
  templateUrl: './msg-alumno.page.html',
  styleUrls: ['./msg-alumno.page.scss'],
})
export class MsgAlumnoPage implements OnInit {
  ngOnInit() {
    const filterButton = document.getElementById('filterButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    filterButton?.addEventListener('click', () => {
      const isVisible = dropdownMenu?.style.display === 'block';
      if (dropdownMenu) {
        dropdownMenu.style.display = isVisible ? 'none' : 'block';
      }
    });

    document.addEventListener('click', (event) => {
      if (
        !filterButton?.contains(event.target as Node) &&
        !dropdownMenu?.contains(event.target as Node)
      ) {
        if (dropdownMenu) {
          dropdownMenu.style.display = 'none';
        }
      }
    });
  }
}
