import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationUser } from './notification-user';

describe('NotificationUser', () => {
  let component: NotificationUser;
  let fixture: ComponentFixture<NotificationUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
