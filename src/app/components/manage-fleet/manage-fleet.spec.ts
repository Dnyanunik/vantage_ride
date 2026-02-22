import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageFleet } from './manage-fleet';

describe('ManageFleet', () => {
  let component: ManageFleet;
  let fixture: ComponentFixture<ManageFleet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageFleet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageFleet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
