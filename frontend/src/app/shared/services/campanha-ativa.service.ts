import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CampanhaAtivaService {
  campanha = signal<any | null>(this.carregarLocal());

  selecionar(c: any) {
    this.campanha.set(c);
    localStorage.setItem('campanha_ativa', JSON.stringify(c));
  }

  limpar() {
    this.campanha.set(null);
    localStorage.removeItem('campanha_ativa');
  }

  private carregarLocal(): any | null {
    try {
      const raw = localStorage.getItem('campanha_ativa');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
