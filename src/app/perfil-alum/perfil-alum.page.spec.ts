import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilAlumPage } from './perfil-alum.page';

describe('PerfilAlumPage', () => {
  let component: PerfilAlumPage;
  let fixture: ComponentFixture<PerfilAlumPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilAlumPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
