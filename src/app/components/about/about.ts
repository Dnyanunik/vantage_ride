import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  experience: string;
  description: string;
  tags: string[];
  stats?: { label: string; value: string }[];
  isInverted: boolean;
  link: string;
  linkText: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, MatDividerModule],
  templateUrl: './about.html',
  styleUrls: ['./about.scss']
})
export class About {

  // Emotional Content Data
  public missionHeader = {
    tag: 'MISSION_ORIGIN_STORY',
    title: 'FROM HUMBLE ROOTS TO LUXURY ROUTES',
    intro: 'Ten years ago, a dream started in a small village. Today, that struggle has evolved into a fleet of excellence built on grit and 8000+ successful journeys.'
  };

  public team: TeamMember[] = [
    {
      name: 'The Visionary Founder',
      role: 'FOUNDER & CHIEF PILOT',
      image: 'image/vishnu.jpeg',
      experience: '10 YEARS',
      description: `Born in a small village, our founder understood the value of every rupee and the importance of a helping hand.
                    He didn't start with a fleet; he started with a promise to provide dignity in travel.
                    After a decade of navigating roads and hearts, he has completed over 8000+ trips,
                    growing from a single dream to a proud owner of 3 luxury vehicles.`,
      tags: ['Grounded Values', 'Expert Navigator', '8000+ Trips'],
      stats: [
        { label: 'Experience', value: '10Y' },
        { label: 'Missions', value: '8000+' },
        { label: 'Fleet', value: '03' }
      ],
      isInverted: false,
      link: 'https://wa.me/917972504272?text=Hello!%20I%20am%20interested%20in%20your%20luxury%20car%20service', // Replace with real phone
      linkText: 'WHATSAPP'
    },
    {
      name: 'Ganesh Nikam',
      role: 'SYSTEM ARCHITECT & INVESTOR',
      image: '/image/ganesh.jpeg',
      experience: 'IT EXPERT',
      description: `An IT Engineer at TCS by day and an entrepreneur by heart. Ganesh brings the
                    precision of global software standards to the local travel industry.
                    As a strategic investor and the mastermind behind our digital cockpit,
                    he ensures that your booking experience is as high-tech and seamless as a luxury lounge.`,
      tags: ['TCS Engineer', 'Startup Investor', 'Full-Stack Developer'],
      isInverted: true,
      link: 'https://www.linkedin.com/in/ganesh-nikam-2762282b3',
      linkText: 'LINKEDIN'
    }
  ];

  goToLink(url: string) {
    if (url) {
      // opens the link in a new tab immediately
      window.open(url, '_blank', 'noopener noreferrer');
    }
  }
}
