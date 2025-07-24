import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TfgProfPage } from './tfg-prof.page';

describe('TfgProfPage', () => {
  let component: TfgProfPage;
  let fixture: ComponentFixture<TfgProfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TfgProfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
