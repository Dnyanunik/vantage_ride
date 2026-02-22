import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationDriver } from './notification-driver';

describe('NotificationDriver', () => {
  let component: NotificationDriver;
  let fixture: ComponentFixture<NotificationDriver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationDriver]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationDriver);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
