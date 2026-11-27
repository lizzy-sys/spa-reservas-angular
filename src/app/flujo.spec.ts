import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { registerLocaleData } from '@angular/common';
import localeEsBo from '@angular/common/locales/es-BO';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { routes } from './app.routes';
import { SpaDb } from './core/spa-db';
import { generarHorarios, SERVICIOS_INICIALES } from './core/datos-iniciales';
import { NuevaReserva } from './pages/nueva-reserva/nueva-reserva';
import { Servicios } from './pages/servicios/servicios';
import { DetalleReserva } from './pages/detalle-reserva/detalle-reserva';
import { Historial } from './pages/historial/historial';
import { ServicioCard } from './shared/servicio-card/servicio-card';

describe('Flujo Angular y navegación', () => {
  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    registerLocaleData(localeEsBo);
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('redirige al catálogo y combina búsqueda y categoría', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/', Servicios);
    await vi.waitFor(() => expect(page['cargando']()).toBe(false));
    expect(TestBed.inject(Router).url).toBe('/servicios');
    page['busqueda'].set('facial');
    page['categoria'].set('masajes');
    expect(page['filtrados']()).toHaveLength(0);
    page['categoria'].set('faciales');
    expect(page['filtrados']()).toHaveLength(2);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelectorAll('app-servicio-card')).toHaveLength(2);
  });

  it('el hijo emite el servicio recibido cuando se pulsa Reservar', async () => {
    const fixture = TestBed.createComponent(ServicioCard);
    fixture.componentRef.setInput('servicio', SERVICIOS_INICIALES[0]);
    const emitido = vi.fn();
    fixture.componentInstance.reservar.subscribe(emitido);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button').click();
    expect(emitido).toHaveBeenCalledWith(SERVICIOS_INICIALES[0]);
  });

  it('impide guardar el formulario vacío o un nombre de espacios', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/reservar', NuevaReserva);
    await vi.waitFor(() => expect(page['servicios']()).toHaveLength(6));
    const guardar = vi.spyOn(TestBed.inject(SpaDb), 'crearReserva');
    await page['guardar']();
    expect(guardar).not.toHaveBeenCalled();
    expect(page['form'].touched).toBe(true);
    page['form'].controls.cliente.setValue('   ');
    expect(page['form'].controls.cliente.invalid).toBe(true);
  });

  it('registra, navega al detalle, recupera por id, cancela y filtra el historial', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/reservar?servicio=1', NuevaReserva);
    await vi.waitFor(() => expect(page['form'].controls.servicioId.value).toBe(1));
    const horario = generarHorarios()[0];
    page['form'].patchValue({
      fecha: horario.fecha,
      cliente: 'Ana Pérez',
      email: 'ana@example.com',
      telefono: '71234567',
    });
    await vi.waitFor(() => expect(page['horarios']().length).toBeGreaterThan(0));
    page['form'].controls.horarioId.setValue(horario.id);
    await page['guardar']();
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toContain('/reservas/1'));
    await harness.navigateByUrl('/servicios');
    const detalle = await harness.navigateByUrl('/reservas/1', DetalleReserva);
    await vi.waitFor(() => expect(detalle['estadoCarga']()).toBe('ok'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Ana Pérez');
    vi.stubGlobal('confirm', () => true);
    await detalle['cancelar']();
    expect(detalle['reserva']()?.estado).toBe('cancelada');
    const historial = await harness.navigateByUrl('/reservas', Historial);
    await vi.waitFor(() => expect(historial['cargando']()).toBe(false));
    historial['estado'].set('cancelada');
    expect(historial['filtradas']()).toHaveLength(1);
    historial['estado'].set('confirmada');
    expect(historial['filtradas']()).toHaveLength(0);
  });

  it.each(['abc', '9999', '1e0'])(
    'muestra un mensaje para el id inválido o inexistente %s',
    async (id) => {
      const harness = await RouterTestingHarness.create();
      const page = await harness.navigateByUrl('/reservas/' + id, DetalleReserva);
      await vi.waitFor(() => expect(page['estadoCarga']()).toBe('no-existe'));
      harness.detectChanges();
      expect(harness.routeNativeElement?.textContent).toContain('Reserva no encontrada');
    },
  );

  it('muestra la página 404 para una ruta desconocida', async () => {
    const harness = await RouterTestingHarness.create('/ruta-inexistente');
    expect(harness.routeNativeElement?.textContent).toContain('La página que buscas no existe');
  });

  it('descarta horarios que llegan tarde y reinicia el horario seleccionado', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/reservar?servicio=1', NuevaReserva);
    await vi.waitFor(() => expect(page['form'].controls.servicioId.value).toBe(1));
    const db = TestBed.inject(SpaDb);
    type Lista = Awaited<ReturnType<SpaDb['getHorariosDisponibles']>>;
    let resolverAnterior!: (lista: Lista) => void;
    const anterior = new Promise<Lista>((resolve) => {
      resolverAnterior = resolve;
    });
    const h1 = generarHorarios()[0];
    const h2 = generarHorarios().find((h) => h.servicioId === 2 && h.fecha === h1.fecha)!;
    vi.spyOn(db, 'getHorariosDisponibles')
      .mockReturnValueOnce(anterior)
      .mockResolvedValueOnce([h2]);
    page['form'].controls.fecha.setValue(h1.fecha);
    page['form'].controls.horarioId.setValue(h1.id);
    page['form'].controls.servicioId.setValue(2);
    await vi.waitFor(() => expect(page['horarios']()).toEqual([h2]));
    resolverAnterior([h1]);
    await anterior;
    await Promise.resolve();
    expect(page['horarios']()).toEqual([h2]);
    expect(page['form'].controls.horarioId.value).toBe(0);
  });

  it('muestra un error recuperable cuando falla IndexedDB', async () => {
    vi.spyOn(TestBed.inject(SpaDb), 'getServicios').mockRejectedValue(new Error('Fallo simulado'));
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/servicios', Servicios);
    await vi.waitFor(() => expect(page['cargando']()).toBe(false));
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar',
    );
  });
});

