import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { AuthService } from '../auth/auth.service';
import { CampanhaAtivaService } from '../shared/services/campanha-ativa.service';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzLayoutModule,
    NzIconModule,
    NzButtonModule,
    NzToolTipModule,
    NzDropDownModule,
  ],
  styles: [`
    /* ── Sidebar (desktop) ───────────────────────────── */
    .sider {
      position: fixed; top: 0; left: 0;
      height: 100vh; display: flex; flex-direction: column;
      background: #fff;
      box-shadow: 2px 0 12px rgba(0,0,0,0.08);
      transition: width 0.22s ease, transform 0.22s ease;
      z-index: 200; overflow: hidden;
    }
    .sider.expanded  { width: 220px; }
    .sider.collapsed { width: 64px; }

    .logo {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 16px 18px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
    }
    .logo-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-size: 16px; color: #fff; box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    .logo-text { overflow: hidden; }
    .logo-title { color: #1a1a1a; font-size: 15px; font-weight: 700; margin: 0; white-space: nowrap; }
    .logo-sub   { color: #888; font-size: 11px; margin: 0; white-space: nowrap; }

    nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 8px; }
    nav::-webkit-scrollbar { width: 0; }
    .nav-section { margin-bottom: 4px; }
    .nav-label {
      font-size: 10px; font-weight: 600; letter-spacing: 1px;
      color: #bbb; text-transform: uppercase; padding: 8px 10px 4px;
      white-space: nowrap; overflow: hidden;
    }
    .nav-item {
      display: flex; align-items: center; gap: 11px;
      padding: 9px 10px; border-radius: 8px; cursor: pointer;
      color: #555; font-size: 13.5px; font-weight: 500;
      text-decoration: none; transition: background 0.15s, color 0.15s;
      white-space: nowrap; overflow: hidden; position: relative; margin-bottom: 2px;
    }
    .nav-item:hover  { background: #eaecf0; color: #1a1a1a; }
    .nav-item.active { background: #dbeafe; color: #1d4ed8; }
    .nav-item.active::before {
      content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
      width: 3px; background: #3b82f6; border-radius: 0 2px 2px 0;
    }
    .nav-icon {
      width: 32px; height: 32px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border-radius: 7px; font-size: 15px;
    }
    .nav-txt { flex: 1; }

    .sider-footer { flex-shrink: 0; border-top: 1px solid #f0f0f0; padding: 10px 8px; }
    .collapse-btn {
      display: flex; align-items: center; gap: 11px; padding: 9px 10px;
      border-radius: 8px; cursor: pointer; color: #888; font-size: 13px;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap; overflow: hidden; border: none; background: transparent; width: 100%;
    }
    .collapse-btn:hover { background: #eaecf0; color: #555; }
    .collapse-icon { width: 32px; height: 32px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 15px; }

    /* ── Desktop header ──────────────────────────────── */
    .header {
      background: #fff; height: 56px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 24px; border-bottom: 1px solid #f0f0f0;
      box-shadow: 0 1px 4px rgba(0,21,41,.06);
      position: sticky; top: 0; z-index: 10;
    }
    .header-left  { display: flex; align-items: center; gap: 10px; }
    .header-right { display: flex; align-items: center; gap: 14px; }
    .campanha-bloco { display: flex; flex-direction: column; gap: 2px; }
    .campanha-label { font-size: 11px; color: #aaa; line-height: 1; margin: 0; }
    .campanha-nome  { font-weight: 600; font-size: 14px; color: #1a1a1a; line-height: 1; margin: 0; }
    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff; font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
    }
    .user-name { font-size: 14px; color: #333; }
    .content-wrap { margin: 20px; }

    /* ── Mobile-only elements (hidden on desktop) ────── */
    .mobile-topbar { display: none; }
    .bottom-tabs   { display: none; }

    /* ── Mobile ──────────────────────────────────────── */
    @media (max-width: 1024px) {
      /* Hide desktop chrome */
      .sider  { display: none !important; }
      .header { display: none !important; }

      /* ── Mobile top bar ── */
      .mobile-topbar {
        display: flex;
        position: fixed; top: 0; left: 0; right: 0; z-index: 100;
        height: 54px;
        background: #fff;
        border-bottom: 1px solid #f0f0f0;
        align-items: center;
        padding: 0 16px;
        justify-content: space-between;
        box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      }
      .mt-brand {
        display: flex; align-items: center; gap: 8px;
      }
      .mt-logo {
        width: 30px; height: 30px; border-radius: 8px;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; color: #fff;
      }
      .mt-title { font-size: 15px; font-weight: 700; color: #1a1a1a; }

      .mt-right { display: flex; align-items: center; gap: 10px; }
      .mt-campanha {
        display: flex; align-items: center; gap: 4px;
        background: #f0f5ff; border-radius: 20px;
        padding: 4px 10px;
      }
      .mt-camp-nome {
        font-size: 12px; font-weight: 600; color: #3b82f6;
        max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        cursor: pointer;
      }
      .mt-swap-btn {
        cursor: pointer; display: flex; align-items: center;
        padding: 2px 0 2px 2px;
      }
      .mt-avatar {
        width: 30px; height: 30px; border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: #fff; font-weight: 700; font-size: 11px;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        cursor: pointer;
      }

      /* ── Bottom tab bar ── */
      .bottom-tabs {
        display: flex;
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
        background: #fff;
        border-top: 1px solid #f0f0f0;
        box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }
      .tab-item {
        flex: 1; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 3px; padding: 8px 4px 6px;
        text-decoration: none; color: #aaa;
        font-size: 10px; font-weight: 500;
        transition: color 0.15s;
        -webkit-tap-highlight-color: transparent;
      }
      .tab-item .tab-icon {
        font-size: 20px; line-height: 1; display: flex; align-items: center;
        transition: transform 0.15s;
      }
      .tab-item.tab-active { color: #3b82f6; }
      .tab-item.tab-active .tab-icon { transform: translateY(-1px); }

      /* Content offset */
      .content-wrap {
        margin: 0;
        padding: 12px 12px calc(env(safe-area-inset-bottom, 0px) + 68px);
        padding-top: 0;
      }
    }

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

    @keyframes lo-fade   { from { opacity: 0; }             to { opacity: 1; } }
    @keyframes lo-slide  { from { transform: translateY(100%); } to { transform: translateY(0); } }

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
  `],
  template: `
    <nz-layout style="min-height:100vh">

      <!-- ══ MOBILE TOP BAR ══ -->
      <div class="mobile-topbar">
        <div class="mt-brand">
          <div class="mt-logo">
            <span nz-icon nzType="trophy" nzTheme="outline"></span>
          </div>
          <span class="mt-title">Carnês</span>
        </div>
        <div class="mt-right">
          <div class="mt-campanha">
            <span class="mt-camp-nome"
                  [nz-tooltip]="campanhaAtiva.campanha()?.nome"
                  nzTooltipTrigger="click"
                  nzTooltipPlacement="bottom">{{ campanhaAtiva.campanha()?.nome }}</span>
            <span class="mt-swap-btn" (click)="trocarCampanha()">
              <span nz-icon nzType="swap" style="font-size:11px; color:#3b82f6"></span>
            </span>
          </div>
          <div class="mt-avatar" (click)="confirmarLogout()"
               [nz-tooltip]="auth.usuario()?.nome ?? ''"
               nzTooltipPlacement="bottom">
            {{ iniciais }}
          </div>
        </div>
      </div>

      <!-- ══════════ SIDEBAR (desktop) ══════════ -->
      <div class="sider"
           [class.expanded]="!collapsed"
           [class.collapsed]="collapsed">

        <div class="logo">
          <div class="logo-icon">
            <span nz-icon nzType="trophy" nzTheme="outline"></span>
          </div>
          <div class="logo-text" *ngIf="!collapsed">
            <p class="logo-title">Carnês</p>
            <p class="logo-sub">Sistema de campanhas</p>
          </div>
        </div>

        <nav>
          <div class="nav-section">
            <div class="nav-label" *ngIf="!collapsed">Geral</div>
            <a class="nav-item" routerLink="/participantes" routerLinkActive="active"
               [nz-tooltip]="collapsed ? 'Participantes' : ''" nzTooltipPlacement="right">
              <div class="nav-icon"><span nz-icon nzType="team"></span></div>
              <span class="nav-txt" *ngIf="!collapsed">Participantes</span>
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-label" *ngIf="!collapsed">Operações</div>
            <a class="nav-item" routerLink="/carnes" routerLinkActive="active"
               [nz-tooltip]="collapsed ? 'Venda de Carnês' : ''" nzTooltipPlacement="right">
              <div class="nav-icon"><span nz-icon nzType="book"></span></div>
              <span class="nav-txt" *ngIf="!collapsed">Venda de Carnês</span>
            </a>
            <a class="nav-item" routerLink="/pagamentos" routerLinkActive="active"
               [nz-tooltip]="collapsed ? 'Pagamentos' : ''" nzTooltipPlacement="right">
              <div class="nav-icon"><span nz-icon nzType="dollar"></span></div>
              <span class="nav-txt" *ngIf="!collapsed">Pagamentos</span>
            </a>
          </div>
          <div class="nav-section">
            <div class="nav-label" *ngIf="!collapsed">Análise</div>
            <a class="nav-item" routerLink="/relatorios" routerLinkActive="active"
               [nz-tooltip]="collapsed ? 'Relatórios' : ''" nzTooltipPlacement="right">
              <div class="nav-icon"><span nz-icon nzType="bar-chart"></span></div>
              <span class="nav-txt" *ngIf="!collapsed">Relatórios</span>
            </a>
          </div>
        </nav>

        <div class="sider-footer">
          <button class="collapse-btn" (click)="collapsed = !collapsed"
                  [nz-tooltip]="collapsed ? 'Expandir menu' : ''" nzTooltipPlacement="right">
            <div class="collapse-icon">
              <span nz-icon [nzType]="collapsed ? 'menu-unfold' : 'menu-fold'"></span>
            </div>
            <span *ngIf="!collapsed" style="font-size:12px">Recolher menu</span>
          </button>
        </div>
      </div>

      <!-- ══════════ CONTEÚDO ══════════ -->
      <nz-layout [style.margin-left]="isMobile ? '0' : (collapsed ? '64px' : '220px')"
                 style="transition:margin-left 0.22s ease; min-height:100vh">

        <!-- Header (desktop only) -->
        <nz-header class="header">
          <div class="header-left">
            <span nz-icon nzType="trophy" style="color:#3b82f6; font-size:16px"></span>
            <div class="campanha-bloco">
              <span class="campanha-label">Campanha ativa</span>
              <span class="campanha-nome">{{ campanhaAtiva.campanha()?.nome }}</span>
            </div>
            <button nz-button nzSize="small" nzType="link"
                    style="font-size:12px; padding:0 4px; color:#3b82f6"
                    (click)="trocarCampanha()">
              Trocar
            </button>
          </div>
          <div class="header-right">
            <span class="user-name">{{ auth.usuario()?.nome }}</span>
            <div class="user-avatar"
                 [nz-tooltip]="auth.usuario()?.email ?? ''"
                 nzTooltipPlacement="bottom">
              {{ iniciais }}
            </div>
            <button nz-button nzType="text" nzSize="small" style="color:#888" (click)="confirmarLogout()">
              <span nz-icon nzType="logout"></span>
              <span class="user-name">Sair</span>
            </button>
          </div>
        </nz-header>

        <nz-content>
          <!-- Mobile: top padding = topbar height -->
          <div [style.padding-top]="isMobile ? '54px' : '0'">
            <div class="content-wrap">
              <router-outlet />
            </div>
          </div>
        </nz-content>
      </nz-layout>

      <!-- ══ MOBILE BOTTOM TAB BAR ══ -->
      <nav class="bottom-tabs">
        <a class="tab-item" routerLink="/participantes" routerLinkActive="tab-active">
          <span class="tab-icon" nz-icon nzType="team"></span>
          <span>Participantes</span>
        </a>
        <a class="tab-item" routerLink="/carnes" routerLinkActive="tab-active">
          <span class="tab-icon" nz-icon nzType="book"></span>
          <span>Vendas</span>
        </a>
        <a class="tab-item" routerLink="/pagamentos" routerLinkActive="tab-active">
          <span class="tab-icon" nz-icon nzType="dollar"></span>
          <span>Pagamentos</span>
        </a>
        <a class="tab-item" routerLink="/relatorios" routerLinkActive="tab-active">
          <span class="tab-icon" nz-icon nzType="bar-chart"></span>
          <span>Relatórios</span>
        </a>
      </nav>

    </nz-layout>

    <!-- ══ LOGOUT CONFIRMATION ══ -->
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
export class LayoutComponent implements OnInit {
  auth = inject(AuthService);
  campanhaAtiva = inject(CampanhaAtivaService);
  private router = inject(Router);
  private api = inject(ApiService);

  collapsed = false;
  isMobile = false;
  mobileOpen = false;
  logoutVisivel = false;

  ngOnInit() {
    this.updateMobile();
    const camp = this.campanhaAtiva.campanha();
    if (camp) {
      this.api.get<any>(`campanhas/${camp.id}`).subscribe({
        next: (c) => {
          if (c.status !== 'ativa') {
            this.campanhaAtiva.limpar();
            this.router.navigate(['/selecionar-campanha']);
          }
        },
        error: () => {
          this.campanhaAtiva.limpar();
          this.router.navigate(['/selecionar-campanha']);
        },
      });
    }
  }

  @HostListener('window:resize')
  updateMobile() {
    this.isMobile = window.innerWidth < 1024;
    if (!this.isMobile) this.mobileOpen = false;
  }

  onNavClick() {
    if (this.isMobile) this.mobileOpen = false;
  }

  get iniciais(): string {
    const nome: string = this.auth.usuario()?.nome ?? '';
    return nome.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();
  }

  confirmarLogout() { this.logoutVisivel = true; }

  trocarCampanha() {
    this.campanhaAtiva.limpar();
    this.router.navigate(['/selecionar-campanha']);
  }
}
