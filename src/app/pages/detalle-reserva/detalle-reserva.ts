import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SpaDb } from '../../core/spa-db';
import { Reserva } from '../../core/models';
import { EstadoBadge } from '../../shared/estado-badge/estado-badge';

@Component({
  selector: 'app-detalle-reserva',
  imports: [DatePipe, CurrencyPipe, TitleCasePipe, NgClass, RouterLink, EstadoBadge],
  templateUrl: './detalle-reserva.html',
})
export class DetalleReserva {
  private db = inject(SpaDb);
  private route = inject(ActivatedRoute);

  protected reserva = signal<Reserva | undefined>(undefined);
  protected estadoCarga = signal<'cargando' | 'ok' | 'no-existe'>('cargando');
  protected idBuscado = signal('');
  protected mensaje = signal('');
  protected error = signal('');
  protected procesando = signal(false);

  constructor() {
    // Lee el :id de la URL (funciona también al recargar la página)
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((p) => this.cargar(p.get('id') ?? ''));
    if (this.route.snapshot.queryParamMap.has('nueva')) {
      this.mensaje.set('¡Reserva registrada con éxito! El horario quedó ocupado para ti.');
    }
  }

  private async cargar(idTexto: string) {
    this.idBuscado.set(idTexto);
    this.estadoCarga.set('cargando');
    const id = Number(idTexto);
    const r = Number.isInteger(id) && id > 0 ? await this.db.getReserva(id) : undefined;
    this.reserva.set(r);
    this.estadoCarga.set(r ? 'ok' : 'no-existe');
  }

  protected async cancelar() {
    const r = this.reserva();
    if (!r || r.estado !== 'confirmada') return;
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    const fecha = r.fechaCita.split('-').reverse().join('/');
    await this.ejecutar(
      () => this.db.cancelarReserva(r.id!),
      `Reserva cancelada. El horario del ${fecha} a las ${r.horaCita} vuelve a estar disponible.`
    );
  }

  protected async marcarAtendida() {
    const r = this.reserva();
    if (!r || r.estado !== 'confirmada') return;
    await this.ejecutar(() => this.db.marcarAtendida(r.id!), 'La reserva fue marcada como atendida.');
  }

  private async ejecutar(accion: () => Promise<Reserva>, textoOk: string) {
    this.procesando.set(true);
    this.error.set('');
    this.mensaje.set('');
    try {
      this.reserva.set(await accion());   // estado actualizado desde IndexedDB
      this.mensaje.set(textoOk);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.procesando.set(false);
    }
  }
}
