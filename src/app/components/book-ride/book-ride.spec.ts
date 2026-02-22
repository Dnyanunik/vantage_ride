import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookRide } from './book-ride';

describe('BookRide', () => {
  let component: BookRide;
  let fixture: ComponentFixture<BookRide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookRide]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookRide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
