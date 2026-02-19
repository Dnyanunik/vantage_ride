import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-service',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './service.html',
  styleUrl: './service.scss',
})
export class Service {

}
