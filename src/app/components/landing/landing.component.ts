import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  // For features tab switching
  featuresActiveTab: string = 'client';

  // For how-it-works tab switching
  howItWorksActiveTab: string = 'clients';

  // For testimonials
  testimonials = [
    {
      quote: 'TechConnect helped us find the perfect IT partner for our project. The process was seamless and efficient!',
      name: 'Jane Doe',
      position: 'CTO, Acme Corp',
      type: 'client',
      image: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
      quote: 'As a vendor, we gained access to high-quality leads and grew our business significantly.',
      name: 'John Smith',
      position: 'CEO, DevSolutions',
      type: 'vendor',
      image: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      quote: "The platform's matching algorithm is top-notch. We saved weeks of effort in vendor selection.",
      name: 'Emily Chen',
      position: 'IT Manager, FinTechX',
      type: 'client',
      image: 'https://randomuser.me/api/portraits/women/68.jpg'
    }
  ];
  activeIndex = 0;

  // For mobile menu
  isMobileMenuOpen = false;

  // For header scroll effect
  isScrolled = false;

  // For footer year
  currentYear = new Date().getFullYear();

  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToSignUp(): void {
    this.router.navigate(['/signup']);
  }

  // Tab switching for features
  setFeaturesActiveTab(tab: string): void {
    this.featuresActiveTab = tab;
  }

  // Tab switching for how-it-works
  setHowItWorksActiveTab(tab: string): void {
    this.howItWorksActiveTab = tab;
  }

  // Testimonials slider
  prevTestimonial(): void {
    this.activeIndex = (this.activeIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  nextTestimonial(): void {
    this.activeIndex = (this.activeIndex + 1) % this.testimonials.length;
  }

  setActiveTestimonial(index: number): void {
    this.activeIndex = index;
  }

  // Mobile menu toggle
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // Header scroll effect
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }
}