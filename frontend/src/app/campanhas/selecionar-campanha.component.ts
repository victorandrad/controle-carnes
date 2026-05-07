import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ApiService } from '../shared/services/api.service';
import { BrlPipe } from '../shared/pipes/brl.pipe';
import { CampanhaAtivaService } from '../shared/services/campanha-ativa.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-selecionar-campanha',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzButtonModule, NzSpinModule, NzTagModule, NzIconModule, BrlPipe],
  styles: [`
    /* ── página ─────────────────────────────────────── */
    .page {
      min-height: 100vh;
      background: linear-gradient(150deg, #f0f5ff 0%, #e6f4ff 50%, #f5f6fa 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
    }

    /* ── brand ──────────────────────────────────────── */
    .brand { text-align: center; margin-bottom: 28px; }
    .brand-icon {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, #1890ff, #096dd9);
      border-radius: 18px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 30px; color: #fff; margin-bottom: 14px;
      box-shadow: 0 6px 20px rgba(24,144,255,0.35);
    }
    .brand h2 { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1a1a1a; }
    .brand p  { margin: 0; color: #999; font-size: 14px; }

    /* ── container ──────────────────────────────────── */
    .container {
      width: 100%; max-width: 880px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    /* ── cabeçalho do container ─────────────────────── */
    .ctn-header {
      padding: 20px 24px 18px;
      border-bottom: 1px solid #f0f0f0;
      display: flex; justify-content: space-between; align-items: center;
    }
    .ctn-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .ctn-header p  { margin: 3px 0 0; font-size: 13px; color: #999; }
    .ctn-actions   { display: flex; align-items: center; gap: 8px; }

    /* ── tabela (desktop) ───────────────────────────── */
    .campanha-row { cursor: pointer; transition: background 0.12s; }
    .campanha-row:hover td { background: #f0f7ff !important; }
    .nome-cell   { font-weight: 600; font-size: 14px; }
    .premio-cell { font-size: 12px; color: #888; margin-top: 3px; }
    .meta-cell   { font-size: 13px; color: #888; }
    .table-wrap  { display: block; }

    /* ── cards (mobile) ─────────────────────────────── */
    .cards-wrap  { display: none; padding: 12px; }
    .cc {
      border: 1.5px solid #f0f0f0;
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 12px;
      background: #fff;
      transition: box-shadow 0.15s, border-color 0.15s;
      cursor: pointer;
    }
    .cc:active { box-shadow: 0 4px 20px rgba(24,144,255,0.15); border-color: #91caff; }
    .cc-top {
      padding: 16px 16px 12px;
      display: flex; align-items: flex-start; gap: 12px;
    }
    .cc-trophy {
      width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #fff7e6, #ffe7ba);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .cc-title { flex: 1; min-width: 0; }
    .cc-nome  { font-size: 16px; font-weight: 700; color: #1a1a1a; line-height: 1.2; }
    .cc-premio { font-size: 13px; color: #888; margin-top: 4px;
                 white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cc-meta {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 0;
      border-top: 1px solid #f5f5f5;
      border-bottom: 1px solid #f5f5f5;
    }
    .cc-meta-item {
      padding: 10px 16px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .cc-meta-item:nth-child(odd) { border-right: 1px solid #f5f5f5; }
    .cc-meta-label { font-size: 11px; color: #bbb; text-transform: uppercase; letter-spacing: .4px; }
    .cc-meta-value { font-size: 15px; font-weight: 600; color: #262626; }
    .cc-meta-value.blue { color: #1890ff; }
    .cc-footer {
      padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .cc-footer-hint { font-size: 12px; color: #bbb; }

    /* ── empty state ─────────────────────────────────── */
    .empty-state { text-align: center; padding: 56px 24px; }
    .empty-icon  { font-size: 44px; color: #ddd; margin-bottom: 14px; }

    /* ── Logout confirmation ─────────────────────────── */
    .logout-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      z-index: 1000;
      animation: lo-fade 0.15s ease;
    }
    .logout-card {
      position: fixed; z-index: 1001;
      background: #fff;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      border-radius: 14px;
      padding: 28px 24px 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      text-align: center;
    }
    .lo-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: #fff1f0; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: #ff4d4f;
    }
    .lo-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .lo-desc  { font-size: 13px; color: #888; line-height: 1.55; margin-bottom: 24px; }
    .lo-btns  { display: flex; gap: 10px; }
    .lo-btns button {
      flex: 1; height: 40px; border-radius: 8px;
      font-size: 14px; font-weight: 500;
      cursor: pointer; border: none; transition: opacity 0.15s;
    }
    .lo-btns button:active { opacity: 0.8; }
    .lo-cancel  { background: #f5f5f5; color: #555; }
    .lo-confirm { background: #ff4d4f; color: #fff; }

    @keyframes lo-fade  { from { opacity: 0; }             to { opacity: 1; } }
    @keyframes lo-slide { from { transform: translateY(100%); } to { transform: translateY(0); } }

    @media (max-width: 1024px) {
      .logout-card {
        top: unset; left: 0; right: 0; bottom: 0;
        transform: none; width: 100%;
        border-radius: 20px 20px 0 0;
        padding: 28px 20px calc(20px + env(safe-area-inset-bottom, 0px));
        animation: lo-slide 0.25s ease;
      }
      .lo-icon  { width: 64px; height: 64px; font-size: 28px; margin-bottom: 18px; }
      .lo-title { font-size: 18px; margin-bottom: 10px; }
      .lo-desc  { font-size: 14px; margin-bottom: 28px; }
      .lo-btns  { flex-direction: column-reverse; gap: 10px; }
      .lo-btns button { height: 52px; font-size: 15px; border-radius: 12px; }
    }

    /* ── mobile ──────────────────────────────────────── */
    @media (max-width: 1024px) {
      .page { padding: 24px 16px; justify-content: flex-start; }
      .brand { margin-bottom: 20px; margin-top: 16px; }
      .brand-icon { width: 52px; height: 52px; font-size: 24px; border-radius: 14px; }
      .brand h2   { font-size: 20px; }
      .container  { border-radius: 16px; }
      .ctn-header { display: none; }
      .table-wrap { display: none; }
      .cards-wrap { display: block; }
    }
  `],
  template: `
    <div class="page">

      <!-- Brand -->
      <div class="brand">
        <div class="brand-icon">
          <span nz-icon nzType="trophy" nzTheme="outline"></span>
        </div>
        <h2>Controle de Carnês</h2>
        <p>Selecione a campanha para continuar</p>
      </div>

      <div class="container">

        <!-- Cabeçalho (desktop) -->
        <div class="ctn-header">
          <div>
            <h3>Campanhas disponíveis</h3>
            <p>Todas as operações serão realizadas na campanha selecionada</p>
          </div>
          <div class="ctn-actions">
            <button nz-button nzType="default" nzSize="small" (click)="gerenciar()">
              <span nz-icon nzType="setting"></span> Gerenciar
            </button>
            <button nz-button nzType="text" style="color:#aaa" (click)="confirmarLogout()">
              <span nz-icon nzType="logout"></span> Sair
            </button>
          </div>
        </div>

        <!-- Loading -->
        <nz-spin *ngIf="carregando" nzTip="Carregando campanhas..."
                 style="display:block; text-align:center; padding:56px" />

        <ng-container *ngIf="!carregando">

          <!-- Empty -->
          <div *ngIf="campanhas.length === 0" class="empty-state">
            <div class="empty-icon"><span nz-icon nzType="trophy" nzTheme="outline"></span></div>
            <p style="font-size:15px; color:#aaa; margin:0 0 4px">Nenhuma campanha ativa</p>
            <p style="font-size:13px; color:#ccc; margin:0 0 20px">
              Faça login como administrador e crie uma campanha primeiro
            </p>
            <button nz-button nzType="default" (click)="gerenciar()">
              <span nz-icon nzType="setting"></span> Gerenciar campanhas
            </button>
          </div>

          <!-- Tabela (desktop) -->
          <div class="table-wrap">
            <nz-table #tb [nzData]="campanhas" [nzShowPagination]="false" nzSize="middle">
              <thead>
                <tr>
                  <th>Nome / Prêmio</th>
                  <th nzWidth="120px">Sorteio</th>
                  <th nzWidth="110px">Valor carnê</th>
                  <th nzWidth="80px">Parcelas</th>
                  <th nzWidth="100px">Máx. carnês</th>
                  <th nzWidth="110px"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of tb.data" class="campanha-row" (click)="selecionar(c)">
                  <td>
                    <div class="nome-cell">{{ c.nome }}</div>
                    <div class="premio-cell">
                      <span nz-icon nzType="trophy" style="color:#faad14; margin-right:4px"></span>
                      {{ c.premio }}
                    </div>
                  </td>
                  <td class="meta-cell">{{ c.dataSorteio | date:'dd/MM/yyyy':'UTC' }}</td>
                  <td style="font-weight:600; color:#1890ff">{{ c.valorCarne | brl }}</td>
                  <td class="meta-cell">{{ c.numParcelas }}x</td>
                  <td class="meta-cell">{{ c.maxCarnes }}</td>
                  <td>
                    <button nz-button nzType="primary" nzSize="small"
                            (click)="selecionar(c); $event.stopPropagation()">
                      Selecionar
                    </button>
                  </td>
                </tr>
              </tbody>
            </nz-table>
          </div>

          <!-- Cards (mobile) -->
          <div class="cards-wrap">
            <div *ngFor="let c of campanhas" class="cc" (click)="selecionar(c)">
              <div class="cc-top">
                <div class="cc-trophy">
                  <span nz-icon nzType="trophy" nzTheme="outline" style="color:#fa8c16"></span>
                </div>
                <div class="cc-title">
                  <div class="cc-nome">{{ c.nome }}</div>
                  <div class="cc-premio">{{ c.premio }}</div>
                </div>
              </div>
              <div class="cc-meta">
                <div class="cc-meta-item">
                  <span class="cc-meta-label">Sorteio</span>
                  <span class="cc-meta-value">{{ c.dataSorteio | date:'dd/MM/yyyy':'UTC' }}</span>
                </div>
                <div class="cc-meta-item">
                  <span class="cc-meta-label">Valor do carnê</span>
                  <span class="cc-meta-value blue">{{ c.valorCarne | brl }}</span>
                </div>
                <div class="cc-meta-item">
                  <span class="cc-meta-label">Parcelas</span>
                  <span class="cc-meta-value">{{ c.numParcelas }}x</span>
                </div>
                <div class="cc-meta-item">
                  <span class="cc-meta-label">Máx. carnês</span>
                  <span class="cc-meta-value">{{ c.maxCarnes }}</span>
                </div>
              </div>
              <div class="cc-footer">
                <span class="cc-footer-hint">Toque para selecionar</span>
                <button nz-button nzType="primary" nzSize="small"
                        (click)="selecionar(c); $event.stopPropagation()">
                  Entrar <span nz-icon nzType="arrow-right"></span>
                </button>
              </div>
            </div>

            <!-- Ações no rodapé mobile -->
            <div style="display:flex; justify-content:center; gap:16px; padding:8px 0 4px; margin-top:4px">
              <button nz-button nzType="text" style="color:#888; font-size:13px" (click)="gerenciar()">
                <span nz-icon nzType="setting"></span> Gerenciar campanhas
              </button>
              <button nz-button nzType="text" style="color:#bbb; font-size:13px" (click)="confirmarLogout()">
                <span nz-icon nzType="logout"></span> Sair
              </button>
            </div>
          </div>

        </ng-container>
      </div>

    </div>

    <!-- Confirmação de logout -->
    <ng-container *ngIf="logoutVisivel">
      <div class="logout-overlay" (click)="logoutVisivel = false"></div>
      <div class="logout-card">
        <div class="lo-icon"><span nz-icon nzType="logout" nzTheme="outline"></span></div>
        <div class="lo-title">Sair da conta</div>
        <div class="lo-desc">Tem certeza que deseja sair?<br>Você precisará fazer login novamente.</div>
        <div class="lo-btns">
          <button class="lo-cancel"  (click)="logoutVisivel = false">Cancelar</button>
          <button class="lo-confirm" (click)="auth.logout()">Sair</button>
        </div>
      </div>
    </ng-container>
  `,
})
export class SelecionarCampanhaComponent implements OnInit {
  auth = inject(AuthService);
  campanhaAtiva = inject(CampanhaAtivaService);

  campanhas: any[] = [];
  carregando = true;
  logoutVisivel = false;

  constructor(private api: ApiService, private router: Router) {}

  confirmarLogout() { this.logoutVisivel = true; }

  ngOnInit() {
    if (this.campanhaAtiva.campanha()) { this.router.navigate(['/']); return; }
    this.api.get<any[]>('campanhas').subscribe({
      next: (data) => { this.campanhas = data.filter(c => c.status === 'ativa'); this.carregando = false; },
      error: () => { this.carregando = false; },
    });
  }

  selecionar(c: any) {
    this.campanhaAtiva.selecionar(c);
    this.router.navigate(['/']);
  }

  gerenciar() {
    this.router.navigate(['/campanhas']);
  }
}
