import { FormControl } from '@angular/forms';
import {
  fechaDesdeManana,
  fechaISO,
  fechaManana,
  fechaValida,
  noDomingo,
  nombreValido,
} from './utilidades';
import { generarHorarios } from './datos-iniciales';

describe('Validadores y agenda', () => {
  it('solo acepta fechas de calendario reales', () => {
    expect(fechaValida('2028-02-29')).toBe(true);
    for (const valor of ['2027-02-29', '2026-13-01', '2026-04-31', 'mañana']) {
      expect(fechaDesdeManana(new FormControl(valor))).toEqual({ fechaInvalida: true });
    }
  });
  it('exige al menos mañana y rechaza el domingo', () => {
    expect(fechaDesdeManana(new FormControl(fechaISO(new Date())))).toEqual({ fechaPasada: true });
    expect(fechaDesdeManana(new FormControl(fechaManana()))).toBeNull();
    expect(noDomingo(new FormControl('2026-11-29'))).toEqual({ domingo: true });
    expect(noDomingo(new FormControl('2026-11-30'))).toBeNull();
  });
  it('no cuenta espacios como nombre', () => {
    expect(nombreValido(new FormControl('  A  '))).toEqual({ nombreInvalido: true });
    expect(nombreValido(new FormControl(' Ana '))).toBeNull();
  });
  it('genera ids únicos, desde mañana, sin domingos y seis horas por servicio y día', () => {
    const horarios = generarHorarios();
    expect(new Set(horarios.map((h) => h.id)).size).toBe(horarios.length);
    expect(
      horarios.every((h) => h.fecha >= fechaManana() && !noDomingo(new FormControl(h.fecha))),
    ).toBe(true);
    expect(
      horarios.filter((h) => h.servicioId === 1 && h.fecha === horarios[0].fecha),
    ).toHaveLength(6);
  });
});
