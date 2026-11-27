import { Component, input } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { EstadoReserva } from '../../core/models';

@Component({
  selector: 'app-estado-badge',
  imports: [NgClass, TitleCasePipe],
  template: `
    <span
      class="badge"
      [ngClass]="{
        'text-bg-success': estado() === 'confirmada',
        'text-bg-secondary': estado() === 'cancelada',
        'text-bg-info': estado() === 'atendida',
      }"
      >{{ estado() | titlecase }}</span
    >
  `,
})
export class EstadoBadge {
  estado = input.required<EstadoReserva>();
}
