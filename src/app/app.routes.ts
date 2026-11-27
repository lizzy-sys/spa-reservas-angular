import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'servicios', pathMatch: 'full' }, // ruta inicial
  {
    path: 'servicios',
    loadComponent: () => import('./pages/servicios/servicios').then((m) => m.Servicios),
    title: 'Servicios | Spa Serenidad',
  },
  {
    path: 'reservar',
    loadComponent: () => import('./pages/nueva-reserva/nueva-reserva').then((m) => m.NuevaReserva),
    title: 'Nueva reserva | Spa Serenidad',
  },
  {
    path: 'reservas',
    loadComponent: () => import('./pages/historial/historial').then((m) => m.Historial),
    title: 'Mis reservas | Spa Serenidad',
  },
  {
    path: 'reservas/:id',
    loadComponent: () =>
      import('./pages/detalle-reserva/detalle-reserva').then((m) => m.DetalleReserva),
    title: 'Detalle de reserva | Spa Serenidad',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/no-encontrado/no-encontrado').then((m) => m.NoEncontrado),
    title: 'Página no encontrada',
  },
];
