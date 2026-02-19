import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnquiryDialog } from './enquiry-dialog';

describe('EnquiryDialog', () => {
  let component: EnquiryDialog;
  let fixture: ComponentFixture<EnquiryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnquiryDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnquiryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
