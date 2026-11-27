# Spa Serenidad

SPA Angular de reservas. **Autora:** Lizbeth Cruz Choque · [@lizzy-sys](https://github.com/lizzy-sys) · [Repositorio](https://github.com/lizzy-sys/spa-reservas-angular) · versión 1.0.0.

## Funcionalidades y reglas

Catálogo de seis servicios con búsqueda y categoría combinadas; formulario reactivo; historial filtrable; detalle persistente; cancelar libera horario; marcar atendida; IndexedDB con semilla única y transacciones; diseño móvil/escritorio; standalone, signals, `input()`/`output()`, `@if`/`@for`, Bootstrap 5. Citas desde mañana, lunes a sábado. Correo normalizado no repite cita confirmada en igual fecha/hora ni entre servicios. Celular boliviano de ocho dígitos con inicio 6/7. La agenda cubre los siguientes 30 días desde el primer uso; IndexedDB es local al origen/perfil.

## Instalación

Generado con Angular CLI 22.3, Node 24.21, npm 11, SCSS, zoneless, sin SSR. Usa Node 24 LTS compatible.

```sh
npm ci
npm start
```

Abrir http://localhost:4200. En PowerShell, usa `npm.cmd` si `npm` está bloqueado.

```sh
npm test -- --watch=false
npm run build
```

Para reiniciar: DevTools → Application → IndexedDB → `spa-reservas-db` → Delete database (borra reservas locales).

## Rutas

| Ruta | Pantalla |
|---|---|
| `/servicios` | Catálogo/filtros |
| `/reservar?servicio=1` | Nueva cita |
| `/reservas` | Historial |
| `/reservas/:id` | Detalle |
| Otra | 404 |

## Rúbrica (50 puntos)

| Criterio | Puntos | Evidencia |
|---|---:|---|
| Flujo/reglas | 14 | `core/spa-db.ts`, reserva |
| IndexedDB | 8 | `core/spa-db.ts`, pruebas |
| Componentes | 6 | `shared/servicio-card`, `estado-badge` |
| Rutas | 5 | `app.routes.ts` |
| Pipes/directivas | 5 | `@if`, `@for`, pipes, NgClass |
| Bootstrap/usabilidad | 4 | estilos y páginas |
| GitHub/documentación | 4 | 11 PR, README |
| Demostración | 4 | guion abajo |

Checklist: [ ] filtros combinados; [ ] formulario y reglas; [ ] persistencia; [ ] correo duplicado bloqueado; [ ] historial/detalle; [ ] cancelación y acción única; [ ] ID inválido; [ ] móvil; [ ] tests/build; [ ] 11 PR en orden; [ ] release v1.0.0.

## Guion demo (5–7 min)

Mostrar repo y commits; combinar filtros; intentar formulario vacío; crear reserva y recargar; cancelar y comprobar horario liberado; filtrar historial; ID inválido. Explicar: `SpaDb` encapsula IndexedDB y la transacción escribe estado y horario juntos; la tarjeta recibe `input()` y emite `output()`. Preguntas: IndexedDB persiste datos estructurados localmente; `meta` evita repetir semilla; transacción mantiene coherencia; los datos no se comparten entre dispositivos.

## Pull requests y Release

Descripciones, ramas, commits sugeridos y checklist: [`docs/prs`](docs/prs/). Abrir y fusionar PR-01→PR-11 en orden, contra `main`, con **Create a merge commit**, nunca squash. Tras PR-11:

```sh
git switch main
git pull origin main
git tag -a v1.0.0 -m "Versión 1.0.0: Spa Serenidad"
git push origin v1.0.0
```

Crear Release desde la etiqueta. Añade capturas reales en `docs/capturas/` después de probar el navegador.

## Publicación en GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` compila la aplicación para el subdirectorio del repositorio y publica al fusionar cambios en `main`. Tras fusionar la configuración, en GitHub abre **Settings → Pages → Build and deployment → Source**, selecciona **GitHub Actions**. Luego abre **Actions**, espera que termine “Publicar Spa Serenidad en GitHub Pages” y entra al enlace de Pages. La dirección esperada es https://lizzy-sys.github.io/spa-reservas-angular/.

El workflow crea `404.html` para que Angular muestre su ruta 404 al visitar una ruta interna directamente. Pages publica un sitio estático; las reservas se guardan en IndexedDB del navegador de cada visitante y no se comparten con la autora.
