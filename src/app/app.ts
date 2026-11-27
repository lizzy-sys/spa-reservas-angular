import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected menuAbierto = signal(false);
  protected cerrarMenu() {
    this.menuAbierto.set(false);
  }
  protected readonly anio = new Date().getFullYear();
  protected readonly menu = [
    { ruta: '/servicios', texto: 'Servicios' },
    { ruta: '/reservar', texto: 'Reservar' },
    { ruta: '/reservas', texto: 'Mis reservas' },
  ];
}
