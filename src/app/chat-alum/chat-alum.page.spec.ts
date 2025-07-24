import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatAlumPage } from './chat-alum.page';

describe('ChatAlumPage', () => {
  let component: ChatAlumPage;
  let fixture: ComponentFixture<ChatAlumPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatAlumPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
