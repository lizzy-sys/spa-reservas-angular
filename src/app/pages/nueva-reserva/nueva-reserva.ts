import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { merge } from 'rxjs';
import { SpaDb } from '../../core/spa-db';
import { Horario, Servicio } from '../../core/models';
import { fechaDesdeManana, fechaManana, noDomingo, nombreValido } from '../../core/utilidades';

@Component({
  selector: 'app-nueva-reserva',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './nueva-reserva.html',
})
export class NuevaReserva implements OnInit {
  private db = inject(SpaDb);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(NonNullableFormBuilder);

  private solicitudHorarios = 0;
  protected cargandoHorarios = signal(false);
  protected servicios = signal<Servicio[]>([]);
  protected horarios = signal<Horario[]>([]);
  protected errorGuardado = signal('');
  protected guardando = signal(false);
  protected readonly fechaMinima = fechaManana();

  protected form = this.fb.group({
    servicioId: [0, [Validators.min(1)]],
    fecha: ['', [Validators.required, fechaDesdeManana, noDomingo]],
    horarioId: [0, [Validators.min(1)]],
    cliente: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(60), nombreValido],
    ],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[67]\d{7}$/)]],
    notas: ['', [Validators.maxLength(200)]],
  });

  constructor() {
    // Al cambiar servicio o fecha, recargar horarios disponibles
    merge(this.form.controls.servicioId.valueChanges, this.form.controls.fecha.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cargarHorarios());
  }

  async ngOnInit() {
    try {
      this.servicios.set(await this.db.getServicios());
    } catch {
      this.errorGuardado.set(
        'No se pudieron cargar los servicios. Recarga la página e intenta de nuevo.',
      );
      return;
    }
    const desdeUrl = Number(this.route.snapshot.queryParamMap.get('servicio'));
    if (desdeUrl) this.form.controls.servicioId.setValue(desdeUrl);
  }

  protected servicioActual(): Servicio | undefined {
    return this.servicios().find((s) => s.id === this.form.controls.servicioId.value);
  }

  protected invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  private async cargarHorarios() {
    const solicitud = ++this.solicitudHorarios;
    this.form.controls.horarioId.setValue(0);
    this.horarios.set([]);
    this.cargandoHorarios.set(false);
    const { servicioId, fecha } = this.form.getRawValue();
    if (servicioId <= 0 || !fecha || this.form.controls.fecha.invalid) return;
    this.cargandoHorarios.set(true);
    try {
      const horarios = await this.db.getHorariosDisponibles(servicioId, fecha);
      if (solicitud === this.solicitudHorarios) this.horarios.set(horarios);
    } catch {
      if (solicitud === this.solicitudHorarios)
        this.errorGuardado.set(
          'No se pudieron cargar los horarios. Cambia la fecha para reintentar.',
        );
    } finally {
      if (solicitud === this.solicitudHorarios) this.cargandoHorarios.set(false);
    }
  }

  protected async guardar() {
    if (this.guardando() || this.cargandoHorarios()) return;
    this.errorGuardado.set('');
    if (this.form.invalid) {
      // impedir guardar datos inválidos
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    try {
      const v = this.form.getRawValue();
      const id = await this.db.crearReserva({
        servicioId: v.servicioId,
        horarioId: v.horarioId,
        cliente: v.cliente,
        email: v.email,
        telefono: v.telefono,
        notas: v.notas,
      });
      this.router.navigate(['/reservas', id], { queryParams: { nueva: 1 } });
    } catch (e) {
      this.errorGuardado.set((e as Error).message); // regla del tema violada
      await this.cargarHorarios();
    } finally {
      this.guardando.set(false);
    }
  }
}
