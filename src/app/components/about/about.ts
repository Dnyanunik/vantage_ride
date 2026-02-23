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
  missionHeader = {
    tag: 'OUR GENESIS',
    title: 'THE VANTAGE VISION',
    intro: 'From a local dream to a global standard of mobility. A decade of relentless grit has forged a premium platform, redefining travel through 2,000+ flawless journeys.'
  };

  public team: TeamMember[] = [
    {
      name: 'Dnyaneshwar Nikam',
      role: 'Founder & Lead Developer',
      experience: '2+ Years',
      image: '/image/Dnyaneshwar.jpg', // Make sure to put your image in the assets folder!
      isInverted: false,
      description: 'Driving the technological and operational vision of Vantage Ride. Combining deep industry expertise with modern software development to engineer a seamless, world-class mobility experience from the ground up.',
      tags: ['Tech Visionary', 'Global Mobility', 'Operations Scalability'],
      stats: [
        { value: '2K+', label: 'Journeys' },
        { value: '2 Yrs', label: 'Legacy' },
        { value: '100%', label: 'Commitment' }
      ],
      linkText: 'LinkedIn',
      link: 'https://www.linkedin.com/in/dnyaneshwar-haridas-nikam-458191281' // Replace with your actual LinkedIn URL
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
    if(url) {
      window.open(url, '_blank');
    }
  }
}
