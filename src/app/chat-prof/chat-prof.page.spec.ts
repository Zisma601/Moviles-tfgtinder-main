import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatProfPage } from './chat-prof.page';

describe('ChatProfPage', () => {
  let component: ChatProfPage;
  let fixture: ComponentFixture<ChatProfPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatProfPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
