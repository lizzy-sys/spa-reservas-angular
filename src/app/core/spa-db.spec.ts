import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { SpaDb } from './spa-db';
import { generarHorarios } from './datos-iniciales';
import { NuevaReservaDatos, Horario } from './models';
import { fechaISO } from './utilidades';

describe('SpaDb: persistencia y reglas del spa', () => {
  let db: SpaDb;
  let h: Horario;
  const datos = (horario = h, email = 'cliente@example.com'): NuevaReservaDatos => ({
    servicioId: horario.servicioId,
    horarioId: horario.id,
    cliente: 'Cliente de prueba',
    email,
    telefono: '71234567',
    notas: '',
  });
  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    db = new SpaDb();
    h = generarHorarios().find((h) => h.servicioId === 1)!;
  });
  afterEach(() => vi.unstubAllGlobals());
  it('siembra seis servicios sin duplicar ni sobrescribir al reconectar', async () => {
    expect(await db.getServicios()).toHaveLength(6);
    const id = await db.crearReserva(datos());
    const otra = new SpaDb();
    expect(await otra.getServicios()).toHaveLength(6);
    expect(await otra.getReservas()).toHaveLength(1);
    expect((await otra.getReserva(id))?.estado).toBe('confirmada');
    expect((await otra.getHorariosDisponibles(1, h.fecha)).some((x) => x.id === h.id)).toBe(false);
  });
  it('normaliza cliente y correo y conserva la reserva desde otra instancia', async () => {
    const id = await db.crearReserva({
      ...datos(),
      cliente: '  Ana Pérez  ',
      email: ' ANA@EXAMPLE.COM ',
    });
    expect(await new SpaDb().getReserva(id)).toMatchObject({
      cliente: 'Ana Pérez',
      email: 'ana@example.com',
      estado: 'confirmada',
    });
  });
  it('impide ocupar dos veces un horario', async () => {
    await db.crearReserva(datos());
    await expect(db.crearReserva(datos(h, 'otra@example.com'))).rejects.toThrow('ya fue reservado');
    expect(await db.getReservas()).toHaveLength(1);
  });
  it('impide duplicar correo, fecha y hora incluso con otro servicio', async () => {
    await db.crearReserva(datos());
    const otro = generarHorarios().find(
      (x) => x.servicioId === 2 && x.fecha === h.fecha && x.hora === h.hora,
    )!;
    await expect(db.crearReserva(datos(otro, ' CLIENTE@EXAMPLE.COM '))).rejects.toThrow(
      'misma fecha y hora',
    );
    expect((await db.getHorariosDisponibles(2, h.fecha)).some((x) => x.id === otro.id)).toBe(true);
  });
  it('serializa dos reservas concurrentes para que solo una ocupe el horario', async () => {
    const resultados = await Promise.allSettled([
      db.crearReserva(datos()),
      new SpaDb().crearReserva(datos(h, 'otra@example.com')),
    ]);
    expect(resultados.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((x) => x.status === 'rejected')).toHaveLength(1);
    expect(await db.getReservas()).toHaveLength(1);
  });
  it('cancelar libera el horario y permite reservarlo de nuevo', async () => {
    const id = await db.crearReserva(datos());
    expect((await db.cancelarReserva(id)).estado).toBe('cancelada');
    expect((await db.getHorariosDisponibles(1, h.fecha)).some((x) => x.id === h.id)).toBe(true);
    await expect(db.crearReserva(datos())).resolves.toBeGreaterThan(id);
    await expect(db.cancelarReserva(id)).rejects.toThrow('ya está cancelada');
    expect((await db.getHorariosDisponibles(1, h.fecha)).some((x) => x.id === h.id)).toBe(false);
  });
  it('atender es irreversible y no libera el horario', async () => {
    const id = await db.crearReserva(datos());
    expect((await db.marcarAtendida(id)).estado).toBe('atendida');
    await expect(db.marcarAtendida(id)).rejects.toThrow('ya está atendida');
    await expect(db.cancelarReserva(id)).rejects.toThrow('ya está atendida');
    expect((await db.getHorariosDisponibles(1, h.fecha)).some((x) => x.id === h.id)).toBe(false);
  });
  it.each([
    { cliente: '   ' },
    { cliente: 'A'.repeat(61) },
    { email: 'invalido' },
    { telefono: '51234567' },
    { telefono: '7123456' },
    { notas: 'a'.repeat(201) },
    { servicioId: 999 },
    { horarioId: -1 },
    { servicioId: 2 },
  ])('rechaza datos inválidos sin escritura parcial: %j', async (cambio) => {
    await expect(db.crearReserva({ ...datos(), ...cambio })).rejects.toThrow();
    expect(await db.getReservas()).toHaveLength(0);
    expect((await db.getHorariosDisponibles(1, h.fecha)).some((x) => x.id === h.id)).toBe(true);
  });
  it('rechaza una fecha pasada y un domingo aunque existan horarios manipulados', async () => {
    await db.getServicios();
    const conexion = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('spa-reservas-db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const domingo = new Date();
    domingo.setDate(domingo.getDate() + (7 - domingo.getDay() || 7));
    for (const fecha of ['2000-01-01', fechaISO(domingo)]) {
      await new Promise<void>((resolve, reject) => {
        const tx = conexion.transaction('horarios', 'readwrite');
        tx.objectStore('horarios').put({ ...h, fecha });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await expect(db.crearReserva(datos())).rejects.toThrow('desde mañana');
    }
    conexion.close();
    expect(await db.getReservas()).toHaveLength(0);
  });
  it('devuelve undefined para un id inexistente y rechaza modificarlo', async () => {
    expect(await db.getReserva(99999)).toBeUndefined();
    await expect(db.cancelarReserva(99999)).rejects.toThrow('no existe');
    await expect(db.marcarAtendida(99999)).rejects.toThrow('no existe');
  });
  it('revierte la ocupación del horario si falla guardar la reserva', async () => {
    await db.getServicios();
    const request = indexedDB.open('spa-reservas-db');
    const conexion = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const proto = Object.getPrototypeOf(conexion.transaction('reservas').objectStore('reservas'));
    const add = vi.spyOn(proto, 'add').mockImplementation(() => {
      throw new DOMException('Fallo simulado', 'QuotaExceededError');
    });
    try {
      await expect(db.crearReserva(datos())).rejects.toThrow('Fallo simulado');
      expect(await db.getReservas()).toHaveLength(0);
      expect((await db.getHorariosDisponibles(1, h.fecha)).some((x) => x.id === h.id)).toBe(true);
    } finally {
      add.mockRestore();
      conexion.close();
    }
  });
});
