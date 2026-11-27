import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { SpaDb } from '../../core/spa-db';
import { CATEGORIAS, Servicio } from '../../core/models';
import { ServicioCard } from '../../shared/servicio-card/servicio-card';

@Component({
  selector: 'app-servicios',
  imports: [ServicioCard, TitleCasePipe],
  templateUrl: './servicios.html',
})
export class Servicios implements OnInit {
  private db = inject(SpaDb);         // servicio inyectado
  private router = inject(Router);

  protected readonly categorias = CATEGORIAS;
  protected servicios = signal<Servicio[]>([]);
  protected cargando = signal(true);
  protected busqueda = signal('');
  protected categoria = signal('todas');

  /** Búsqueda por texto Y filtro por categoría funcionando JUNTOS */
  protected filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const cat = this.categoria();
    return this.servicios().filter((s) =>
      (cat === 'todas' || s.categoria === cat) &&
      (!texto || s.nombre.toLowerCase().includes(texto) || s.descripcion.toLowerCase().includes(texto))
    );
  });

  async ngOnInit() {
    this.servicios.set(await this.db.getServicios());
    this.cargando.set(false);
  }

  /** Recibe el evento del hijo (output) */
  protected irAReservar(s: Servicio) {
    this.router.navigate(['/reservar'], { queryParams: { servicio: s.id } });
  }

  protected limpiar() {
    this.busqueda.set('');
    this.categoria.set('todas');
  }
}
