import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SpaDb } from '../../core/spa-db';
import { ESTADOS, EstadoReserva, Reserva } from '../../core/models';
import { EstadoBadge } from '../../shared/estado-badge/estado-badge';

@Component({
  selector: 'app-historial',
  imports: [DatePipe, TitleCasePipe, NgClass, RouterLink, EstadoBadge],
  templateUrl: './historial.html',
})
export class Historial implements OnInit {
  private db = inject(SpaDb);
  private router = inject(Router);

  protected readonly estados = ESTADOS;
  protected reservas = signal<Reserva[]>([]);
  protected errorCarga = signal('');
  protected cargando = signal(true);
  protected estado = signal<'todas' | EstadoReserva>('todas');

  protected filtradas = computed(() =>
    this.estado() === 'todas'
      ? this.reservas()
      : this.reservas().filter((r) => r.estado === this.estado()),
  );

  async ngOnInit() {
    this.errorCarga.set('');
    this.cargando.set(true);
    try {
      this.reservas.set(await this.db.getReservas());
    } catch {
      this.errorCarga.set(
        'No se pudieron cargar los datos. Comprueba que IndexedDB esté habilitado.',
      );
    } finally {
      this.cargando.set(false);
    }
  }

  protected contar(e: EstadoReserva): number {
    return this.reservas().filter((r) => r.estado === e).length;
  }

  protected verDetalle(id: number) {
    this.router.navigate(['/reservas', id]);
  }
}
