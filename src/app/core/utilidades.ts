import { ValidatorFn } from '@angular/forms';

/** Convierte una fecha local a 'YYYY-MM-DD' */
export function fechaISO(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Fecha de mañana en formato 'YYYY-MM-DD' */
export function fechaManana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return fechaISO(d);
}

/** Regla del spa: reservar con al menos 1 día de anticipación */
export const fechaDesdeManana: ValidatorFn = (control) =>
  !control.value || control.value >= fechaManana() ? null : { fechaPasada: true };

/** Regla del spa: domingos cerrado */
export const noDomingo: ValidatorFn = (control) => {
  if (!control.value) return null;
  const [a, m, d] = String(control.value).split('-').map(Number);
  return new Date(a, m - 1, d).getDay() === 0 ? { domingo: true } : null;
};
