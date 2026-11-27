import { Horario, Servicio } from './models';
import { fechaISO } from './utilidades';

export const SERVICIOS_INICIALES: Servicio[] = [
  { id: 1, nombre: 'masaje relajante', categoria: 'masajes', descripcion: 'Masaje de cuerpo completo con aceites esenciales.', duracionMin: 60, precio: 180 },
  { id: 2, nombre: 'masaje descontracturante', categoria: 'masajes', descripcion: 'Presión profunda en espalda, cuello y hombros.', duracionMin: 50, precio: 200 },
  { id: 3, nombre: 'limpieza facial profunda', categoria: 'faciales', descripcion: 'Limpieza, exfoliación y mascarilla purificante.', duracionMin: 60, precio: 150 },
  { id: 4, nombre: 'hidratación facial', categoria: 'faciales', descripcion: 'Tratamiento hidratante con ácido hialurónico.', duracionMin: 45, precio: 130 },
  { id: 5, nombre: 'exfoliación corporal', categoria: 'corporales', descripcion: 'Exfoliación con sales marinas y crema nutritiva.', duracionMin: 45, precio: 160 },
  { id: 6, nombre: 'manicura spa', categoria: 'manicura', descripcion: 'Limado, cutículas, hidratación y esmaltado.', duracionMin: 40, precio: 90 },
];

const HORAS = ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30'];

/** Genera horarios para los próximos `dias` días (sin domingos), desde mañana */
export function generarHorarios(dias = 30): Horario[] {
  const lista: Horario[] = [];
  const hoy = new Date();
  for (const s of SERVICIOS_INICIALES) {
    for (let i = 1; i <= dias; i++) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
      if (d.getDay() === 0) continue; // domingo cerrado
      HORAS.forEach((hora, j) =>
        lista.push({ id: s.id * 10000 + i * 100 + j, servicioId: s.id, fecha: fechaISO(d), hora, disponible: true })
      );
    }
  }
  return lista;
}
