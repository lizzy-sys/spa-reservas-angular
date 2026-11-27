import { Injectable } from '@angular/core';
import { Horario, NuevaReservaDatos, Reserva, Servicio } from './models';
import { SERVICIOS_INICIALES, generarHorarios } from './datos-iniciales';

import { FormControl, Validators } from '@angular/forms';
import { fechaManana, fechaValida, noDomingo } from './utilidades';

const DB_NOMBRE = 'spa-reservas-db';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class SpaDb {
  private conexion?: Promise<IDBDatabase>;

  // ---------- Conexión y semilla ----------
  private db(): Promise<IDBDatabase> {
    this.conexion ??= this.abrir().then(async (db) => {
      try { await this.sembrar(db); return db; }
      catch (error) { db.close(); throw error; }
    }).catch((error) => { this.conexion = undefined; throw error; });
    return this.conexion;
  }

  private abrir(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const peticion = indexedDB.open(DB_NOMBRE, DB_VERSION);
      // Solo se ejecuta la PRIMERA vez (o al subir DB_VERSION): crea los almacenes
      peticion.onupgradeneeded = () => {
        const db = peticion.result;
        db.createObjectStore('servicios', { keyPath: 'id' });
        const horarios = db.createObjectStore('horarios', { keyPath: 'id' });
        horarios.createIndex('por_servicio_fecha', ['servicioId', 'fecha']);
        const reservas = db.createObjectStore('reservas', { keyPath: 'id', autoIncrement: true });
        reservas.createIndex('por_estado', 'estado');
        db.createObjectStore('meta', { keyPath: 'clave' });
      };
      peticion.onsuccess = () => {
        const db = peticion.result;
        db.onversionchange = () => { db.close(); this.conexion = undefined; };
        resolve(db);
      };
      peticion.onerror = () => reject(peticion.error);
    });
  }

  /** Carga los datos iniciales UNA SOLA VEZ (usa la marca 'semilla' en el almacén meta) */
  private async sembrar(db: IDBDatabase): Promise<void> {
    const tx = db.transaction(['meta', 'servicios', 'horarios'], 'readwrite');
    const fin = this.terminar(tx);
    try {
    const yaSembrado = await this.esperar(tx.objectStore('meta').get('semilla'));
    if (!yaSembrado) {
      SERVICIOS_INICIALES.forEach((s) => tx.objectStore('servicios').put(s));
      generarHorarios().forEach((h) => tx.objectStore('horarios').put(h));
      tx.objectStore('meta').put({ clave: 'semilla', fecha: new Date().toISOString() });
    }
    await fin;
    } catch (error) { await this.abortar(tx, fin); throw error; }
  }

  // ---------- Ayudantes: convierten callbacks de IndexedDB en Promesas ----------
  private esperar<T>(peticion: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      peticion.onsuccess = () => {
        const db = peticion.result;
        db.onversionchange = () => { db.close(); this.conexion = undefined; };
        resolve(db);
      };
      peticion.onerror = () => reject(peticion.error);
    });
  }

  private terminar(tx: IDBTransaction): Promise<void> {
    const fin = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('La operación fue cancelada.'));
    });
    // La operación puede fallar antes de alcanzar await fin.
    void fin.catch(() => undefined);
    return fin;
  }

  private async abortar(tx: IDBTransaction, fin: Promise<void>): Promise<void> {
    try { tx.abort(); } catch { /* Ya terminó o fue abortada por IndexedDB. */ }
    await fin.catch(() => undefined);
  }

  private async leerTodo<T>(almacen: string): Promise<T[]> {
    const db = await this.db();
    return (await this.esperar(db.transaction(almacen).objectStore(almacen).getAll())) as T[];
  }

  private async leerUno<T>(almacen: string, id: number): Promise<T | undefined> {
    const db = await this.db();
    return (await this.esperar(db.transaction(almacen).objectStore(almacen).get(id))) as T | undefined;
  }

  // ---------- LEER ----------
  getServicios(): Promise<Servicio[]> {
    return this.leerTodo<Servicio>('servicios');
  }

  getServicio(id: number): Promise<Servicio | undefined> {
    return this.leerUno<Servicio>('servicios', id);
  }

  async getReservas(): Promise<Reserva[]> {
    const lista = await this.leerTodo<Reserva>('reservas');
    return lista.sort((a, b) => b.creadaEn.localeCompare(a.creadaEn)); // más recientes primero
  }

  getReserva(id: number): Promise<Reserva | undefined> {
    return this.leerUno<Reserva>('reservas', id);
  }

  async getHorariosDisponibles(servicioId: number, fecha: string): Promise<Horario[]> {
    const db = await this.db();
    const indice = db.transaction('horarios').objectStore('horarios').index('por_servicio_fecha');
    const lista = (await this.esperar(indice.getAll([servicioId, fecha]))) as Horario[];
    return lista.filter((h) => h.disponible).sort((a, b) => a.hora.localeCompare(b.hora));
  }

  // ---------- GUARDAR (con reglas del tema) ----------
  async crearReserva(datos: NuevaReservaDatos): Promise<number> {
    const nombre = datos.cliente.trim();
    if (nombre.length < 3 || nombre.length > 60) throw new Error('El nombre debe tener entre 3 y 60 caracteres.');
    if (!datos.email.trim() || Validators.email(new FormControl(datos.email.trim()))) throw new Error('Ingresa un correo válido.');
    if (!/^[67]\d{7}$/.test(datos.telefono.trim())) throw new Error('Ingresa un celular boliviano válido.');
    if (datos.notas.length > 200) throw new Error('Las notas admiten un máximo de 200 caracteres.');
    if (!Number.isSafeInteger(datos.servicioId) || !Number.isSafeInteger(datos.horarioId)) throw new Error('Selecciona un servicio y horario válidos.');
    const db = await this.db();
    const tx = db.transaction(['servicios', 'horarios', 'reservas'], 'readwrite');
    const fin = this.terminar(tx);

    try {
    const horario = (await this.esperar(tx.objectStore('horarios').get(datos.horarioId))) as Horario | undefined;
    if (!horario || horario.servicioId !== datos.servicioId) throw new Error('El horario seleccionado no existe.');
    if (!fechaValida(horario.fecha) || horario.fecha < fechaManana() || noDomingo(new FormControl(horario.fecha))) throw new Error('Reserva desde mañana, de lunes a sábado.');
    // Regla 1: horario ocupado no se puede reservar
    if (!horario.disponible) throw new Error('Ese horario ya fue reservado. Elige otro.');

    const servicio = (await this.esperar(tx.objectStore('servicios').get(datos.servicioId))) as Servicio | undefined;
    if (!servicio) throw new Error('El servicio no existe.');
    const confirmadas = (await this.esperar(
      tx.objectStore('reservas').index('por_estado').getAll('confirmada')
    )) as Reserva[];

    // Regla 3: el mismo correo no puede tener dos reservas a la misma fecha y hora
    const email = datos.email.trim().toLowerCase();
    if (confirmadas.some((r) => r.email === email && r.fechaCita === horario.fecha && r.horaCita === horario.hora)) {
      throw new Error('Ya tienes una reserva confirmada en esa misma fecha y hora.');
    }

    horario.disponible = false; // el horario queda ocupado
    tx.objectStore('horarios').put(horario);

    const reserva: Reserva = {
      servicioId: servicio.id,
      servicioNombre: servicio.nombre,
      precio: servicio.precio,
      horarioId: horario.id,
      fechaCita: horario.fecha,
      horaCita: horario.hora,
      cliente: datos.cliente.trim(),
      email,
      telefono: datos.telefono.trim(),
      notas: datos.notas.trim(),
      estado: 'confirmada',
      creadaEn: new Date().toISOString(),
    };
    const id = Number(await this.esperar(tx.objectStore('reservas').add(reserva)));
    await fin; // todo se guarda junto (transacción atómica)
    return id;
    } catch (error) { await this.abortar(tx, fin); throw error; }
  }

  // ---------- ACTUALIZAR ----------
  /** Regla 2 y 4: cancelar libera el horario y solo puede hacerse una vez */
  async cancelarReserva(id: number): Promise<Reserva> {
    const db = await this.db();
    const tx = db.transaction(['reservas', 'horarios'], 'readwrite');
    const fin = this.terminar(tx);

    try {
    const reserva = (await this.esperar(tx.objectStore('reservas').get(id))) as Reserva | undefined;
    if (!reserva) throw new Error('La reserva no existe.');
    if (reserva.estado !== 'confirmada') throw new Error(`No se puede cancelar: la reserva ya está ${reserva.estado}.`);

    const horario = (await this.esperar(tx.objectStore('horarios').get(reserva.horarioId))) as Horario | undefined;
    if (!horario) throw new Error('El horario de la reserva no existe.');
    horario.disponible = true; // el horario vuelve a estar disponible
    reserva.estado = 'cancelada';
    reserva.actualizadaEn = new Date().toISOString();

    tx.objectStore('horarios').put(horario);
    tx.objectStore('reservas').put(reserva);
    await fin;
    return reserva;
    } catch (error) { await this.abortar(tx, fin); throw error; }
  }

  /** Marca la reserva como atendida (solo si está confirmada, una sola vez) */
  async marcarAtendida(id: number): Promise<Reserva> {
    const db = await this.db();
    const tx = db.transaction('reservas', 'readwrite');
    const fin = this.terminar(tx);

    try {
    const reserva = (await this.esperar(tx.objectStore('reservas').get(id))) as Reserva | undefined;
    if (!reserva) throw new Error('La reserva no existe.');
    if (reserva.estado !== 'confirmada') throw new Error(`La reserva ya está ${reserva.estado}.`);

    reserva.estado = 'atendida';
    reserva.actualizadaEn = new Date().toISOString();
    tx.objectStore('reservas').put(reserva);
    await fin;
    return reserva;
    } catch (error) { await this.abortar(tx, fin); throw error; }
  }
}
