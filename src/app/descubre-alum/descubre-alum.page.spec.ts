import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DescubreAlumPage } from './descubre-alum.page';

describe('DescubreAlumPage', () => {
  let component: DescubreAlumPage;
  let fixture: ComponentFixture<DescubreAlumPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DescubreAlumPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
