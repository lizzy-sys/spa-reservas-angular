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

/** Rechaza fechas inexistentes y formatos diferentes de YYYY-MM-DD. */
export function fechaValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split('-').map(Number);
  return fechaISO(new Date(a, m - 1, d)) === valor;
}

export const fechaDesdeManana: ValidatorFn = (control) => {
  if (!control.value) return null;
  if (!fechaValida(control.value)) return { fechaInvalida: true };
  return control.value >= fechaManana() ? null : { fechaPasada: true };
};

export const noDomingo: ValidatorFn = (control) => {
  if (!control.value || !fechaValida(control.value)) return null;
  const [a, m, d] = String(control.value).split('-').map(Number);
  return new Date(a, m - 1, d).getDay() === 0 ? { domingo: true } : null;
};

export const nombreValido: ValidatorFn = (control) => {
  const nombre = String(control.value ?? '').trim();
  return nombre.length >= 3 && nombre.length <= 60 ? null : { nombreInvalido: true };
};
