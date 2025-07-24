import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MsgProfPage } from './msg-prof.page';

describe('MsgProfPage', () => {
  let component: MsgProfPage;
  let fixture: ComponentFixture<MsgProfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MsgProfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
