import { Routes } from '@angular/router';
import { Servicios } from './pages/servicios/servicios';
import { NuevaReserva } from './pages/nueva-reserva/nueva-reserva';
import { Historial } from './pages/historial/historial';
import { DetalleReserva } from './pages/detalle-reserva/detalle-reserva';
import { NoEncontrado } from './pages/no-encontrado/no-encontrado';

export const routes: Routes = [
  { path: '', redirectTo: 'servicios', pathMatch: 'full' },            // ruta inicial
  { path: 'servicios', component: Servicios, title: 'Servicios | Spa Serenidad' },
  { path: 'reservar', component: NuevaReserva, title: 'Nueva reserva | Spa Serenidad' },
  { path: 'reservas', component: Historial, title: 'Mis reservas | Spa Serenidad' },
  { path: 'reservas/:id', component: DetalleReserva, title: 'Detalle de reserva | Spa Serenidad' },
  { path: '**', component: NoEncontrado, title: 'Página no encontrada' },
];
