import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { auth } from '../../core/config/firebase.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit, OnDestroy {
  private router = inject(Router);
  menuOpen = signal(false);
  currentSlideIndex = signal(0);
  currentDemoSlideIndex = signal(0);

  heroSlides = [
    {
      src: 'assets/images/Manage%20money-amico.png',
      alt: 'Ilustração de gestão financeira pessoal',
    },
    {
      src: 'assets/images/Investment%20data-amico.png',
      alt: 'Ilustração de dados e planejamento financeiro',
    },
  ];

  demoSlides = [
    { src: 'assets/images/lading/1.png', alt: 'Tela de demonstração do sistema 1' },
    { src: 'assets/images/lading/2.png', alt: 'Tela de demonstração do sistema 2' },
    { src: 'assets/images/lading/3.png', alt: 'Tela de demonstração do sistema 3' },
    { src: 'assets/images/lading/4.png', alt: 'Tela de demonstração do sistema 4' },
  ];

  private slideIntervalId: ReturnType<typeof setInterval> | null = null;
  private demoSlideIntervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.slideIntervalId = setInterval(() => {
      this.nextSlide();
    }, 4000);

    this.demoSlideIntervalId = setInterval(() => {
      this.nextDemoSlide();
    }, 4000);
  }

  ngOnDestroy() {
    if (this.slideIntervalId) {
      clearInterval(this.slideIntervalId);
    }

    if (this.demoSlideIntervalId) {
      clearInterval(this.demoSlideIntervalId);
    }
  }

  toggleMenu() {
    this.menuOpen.update((value) => !value);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  goToLogin() {
    this.closeMenu();
    this.router.navigate(['/app/login']);
  }

  goToRegister() {
    this.closeMenu();
    this.router.navigate(['/app/register']);
  }

  goToBillingOrRegister() {
    this.closeMenu();

    if (auth.currentUser) {
      this.router.navigate(['/app/billing']);
      return;
    }

    this.router.navigate(['/app/register']);
  }

  scrollToSection(sectionId: string) {
    this.closeMenu();
    const element = document.getElementById(sectionId);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  currentSlide() {
    return this.heroSlides[this.currentSlideIndex()];
  }

  setSlide(index: number) {
    this.currentSlideIndex.set(index);
  }

  currentDemoSlide() {
    return this.demoSlides[this.currentDemoSlideIndex()];
  }

  setDemoSlide(index: number) {
    this.currentDemoSlideIndex.set(index);
  }

  prevDemoSlide() {
    this.currentDemoSlideIndex.update(
      (value) => (value - 1 + this.demoSlides.length) % this.demoSlides.length,
    );
  }

  nextDemoSlideFromUi() {
    this.nextDemoSlide();
  }

  private nextSlide() {
    this.currentSlideIndex.update((value) => (value + 1) % this.heroSlides.length);
  }

  private nextDemoSlide() {
    this.currentDemoSlideIndex.update((value) => (value + 1) % this.demoSlides.length);
  }
}
