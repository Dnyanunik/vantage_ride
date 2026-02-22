import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PilotRoutes } from './pilot-routes';

describe('PilotRoutes', () => {
  let component: PilotRoutes;
  let fixture: ComponentFixture<PilotRoutes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PilotRoutes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PilotRoutes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
