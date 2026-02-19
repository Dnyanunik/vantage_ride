import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select'; // Ensure this is imported
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-enquiry-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatSelectModule
  ],
  templateUrl: './enquiry-dialog.html',
  styleUrl: './enquiry-dialog.scss'
})
export class EnquiryDialog implements OnInit {
  enquiry = { name: '', phone: '', source: '', destination: '', car: 'Swift Dzire', message: '' };

  locations: string[] = [
    'Pune', 'Bhimashankar', 'Lonavala', 'Mahabaleshwar',
    'Alibag', 'Goa', 'Matheran', 'Tarkarli Beach', 'Diveagar Beach'
  ];

  availableCars = [
    { name: 'Swift Dzire', type: '4 Seater', icon: 'directions_car' },
    { name: 'Maruti Suzuki Ertiga', type: '6 Seater', icon: 'airport_shuttle' }, // Fixed 'resolve' to 'name'
    { name: 'Maruti Suzuki WagonR', type: '4 Seater', icon: 'drive_eta' }
  ];

  fareMap: any = {
    'Bhimashankar': { '4 Seater': 3599, '6 Seater': 4500, km: 250 },
    'Lonavala': { '4 Seater': 3599, '6 Seater': 4500, km: 200 },
    'Mahabaleshwar': { '4 Seater': 3599, '6 Seater': 4500, km: 280 },
    'Alibag': { '4 Seater': 5999, '6 Seater': 6599, km: 350 },
    'Goa': { '4 Seater': 14999, '6 Seater': 16999, km: 1000 },
    'Matheran': { '4 Seater': 3999, '6 Seater': 4599, km: 250 },
    'Tarkarli Beach': { '4 Seater': 10999, '6 Seater': 12599, km: 850 },
    'Diveagar Beach': { '4 Seater': 5999, '6 Seater': 6599, km: 350 }
  };

  perKmRates: any = {
    'Maruti Suzuki Ertiga': 15,
    'Swift Dzire': 12,
    'Maruti Suzuki WagonR': 11
  };

  sourceControl = new FormControl('');
  destControl = new FormControl('');
  filteredSources!: Observable<string[]>;
  filteredDestinations!: Observable<string[]>;

  constructor(
    public ref: MatDialogRef<EnquiryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.filteredSources = this.sourceControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );

    this.filteredDestinations = this.destControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.locations.filter(loc => loc.toLowerCase().includes(filterValue));
  }

  // Getter for UI logic
  get bookingSummary() {
    const dest = this.destControl.value;
    const selectedCar = this.enquiry.car;
    const carObj = this.availableCars.find(c => c.name === selectedCar);

    if (dest && carObj && this.fareMap[dest]) {
      const price = this.fareMap[dest][carObj.type];
      return {
        price: `₹${price}/-`,
        details: `${this.fareMap[dest].km} KM Limit | Extra ₹${this.perKmRates[selectedCar]}/km`,
        valid: true
      };
    }
    return { price: 'Get Quote', details: 'Select destination for fare', valid: false };
  }

  submit() {
    this.enquiry.source = this.sourceControl.value || '';
    this.enquiry.destination = this.destControl.value || '';
    // Attach calculated price to the enquiry object before closing
    const summary = this.bookingSummary;
    const finalData = { ...this.enquiry, price: summary.price, extraKm: summary.details };
    this.ref.close(finalData);
  }
}
