import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilProfPage } from './perfil-prof.page';

describe('PerfilProfPage', () => {
  let component: PerfilProfPage;
  let fixture: ComponentFixture<PerfilProfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilProfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
