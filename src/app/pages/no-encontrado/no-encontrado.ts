import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  template: `
    <div class="text-center py-5">
      <h1 class="display-5">404</h1>
      <p class="lead">La página que buscas no existe.</p>
      <a routerLink="/servicios" class="btn btn-primary">Ir a servicios</a>
    </div>
  `,
})
export class NoEncontrado {}
