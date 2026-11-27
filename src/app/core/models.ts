export type Categoria = 'masajes' | 'faciales' | 'corporales' | 'manicura';
export type EstadoReserva = 'confirmada' | 'cancelada' | 'atendida';

export const CATEGORIAS: Categoria[] = ['masajes', 'faciales', 'corporales', 'manicura'];
export const ESTADOS: EstadoReserva[] = ['confirmada', 'cancelada', 'atendida'];

export interface Servicio {
  id: number;
  nombre: string;
  categoria: Categoria;
  descripcion: string;
  duracionMin: number;
  precio: number;
}

export interface Horario {
  id: number;
  servicioId: number;
  fecha: string;      // 'YYYY-MM-DD'
  hora: string;       // 'HH:mm'
  disponible: boolean;
}

export interface Reserva {
  id?: number;              // lo asigna IndexedDB (autoIncrement)
  servicioId: number;
  servicioNombre: string;
  precio: number;
  horarioId: number;
  fechaCita: string;        // 'YYYY-MM-DD'
  horaCita: string;         // 'HH:mm'
  cliente: string;
  email: string;
  telefono: string;
  notas: string;
  estado: EstadoReserva;
  creadaEn: string;         // ISO
  actualizadaEn?: string;   // ISO
}

export interface NuevaReservaDatos {
  servicioId: number;
  horarioId: number;
  cliente: string;
  email: string;
  telefono: string;
  notas: string;
}
