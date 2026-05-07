import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CampanhaAtivaService } from '../services/campanha-ativa.service';

export const campanhaGuard: CanActivateFn = () => {
  const campanha = inject(CampanhaAtivaService);
  if (campanha.campanha()) return true;
  return inject(Router).createUrlTree(['/selecionar-campanha']);
};
