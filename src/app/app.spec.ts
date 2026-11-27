import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
describe('App', () => {
  it('muestra la marca y las tres rutas principales', async () => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.navbar-brand')?.textContent).toContain('Spa Serenidad');
    expect(root.querySelectorAll('.nav-link').length).toBe(3);
  });
});
