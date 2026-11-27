import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { merge } from 'rxjs';
import { SpaDb } from '../../core/spa-db';
import { Horario, Servicio } from '../../core/models';
import { fechaDesdeManana, fechaManana, noDomingo } from '../../core/utilidades';

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

  protected servicios = signal<Servicio[]>([]);
  protected horarios = signal<Horario[]>([]);
  protected errorGuardado = signal('');
  protected guardando = signal(false);
  protected readonly fechaMinima = fechaManana();

  protected form = this.fb.group({
    servicioId: [0, [Validators.min(1)]],
    fecha: ['', [Validators.required, fechaDesdeManana, noDomingo]],
    horarioId: [0, [Validators.min(1)]],
    cliente: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
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
    this.servicios.set(await this.db.getServicios());
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
    this.form.controls.horarioId.setValue(0);
    const { servicioId, fecha } = this.form.getRawValue();
    const valido = servicioId > 0 && !!fecha && this.form.controls.fecha.valid;
    this.horarios.set(valido ? await this.db.getHorariosDisponibles(servicioId, fecha) : []);
  }

  protected async guardar() {
    this.errorGuardado.set('');
    if (this.form.invalid) {           // impedir guardar datos inválidos
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
      this.errorGuardado.set((e as Error).message);   // regla del tema violada
      await this.cargarHorarios();
    } finally {
      this.guardando.set(false);
    }
  }
}
