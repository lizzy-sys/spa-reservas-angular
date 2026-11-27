import { Component, input, output } from '@angular/core';
import { CurrencyPipe, NgClass, TitleCasePipe } from '@angular/common';
import { Servicio } from '../../core/models';

@Component({
  selector: 'app-servicio-card',
  imports: [CurrencyPipe, TitleCasePipe, NgClass],
  templateUrl: './servicio-card.html',
})
export class ServicioCard {
  /** PADRE → HIJO: el servicio a mostrar */
  servicio = input.required<Servicio>();
  /** HIJO → PADRE: avisa que el usuario quiere reservar */
  reservar = output<Servicio>();

  protected readonly colores: Record<string, string> = {
    masajes: 'text-bg-primary',
    faciales: 'text-bg-success',
    corporales: 'text-bg-warning',
    manicura: 'text-bg-info',
  };
}
