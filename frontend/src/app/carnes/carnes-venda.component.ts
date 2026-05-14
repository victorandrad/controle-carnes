import { Component, OnInit, inject, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { ApiService } from '../shared/services/api.service';
import { CampanhaAtivaService } from '../shared/services/campanha-ativa.service';
import { BrlPipe } from '../shared/pipes/brl.pipe';

@Component({
  selector: 'app-carnes-venda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzPageHeaderModule,
    NzEmptyModule,
    NzTableModule,
    NzIconModule,
    NzCardModule,
    NzButtonModule,
    NzInputModule,
    NzInputNumberModule,
    NzDividerModule,
    NzSpinModule,
    NzToolTipModule,
    NzModalModule,
    BrlPipe,
  ],
  styles: [`
    /* ── modal de confirmação ─────────────────────────── */
    .conf-header {
      display: flex; align-items: center; gap: 14px;
      padding: 4px 0 20px;
      border-bottom: 1px solid #f5f5f5;
      margin-bottom: 20px;
    }
    .conf-avatar {
      width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #1677ff, #0958d9);
      color: #fff; font-weight: 700; font-size: 17px;
      display: flex; align-items: center; justify-content: center;
    }
    .conf-nome  { font-size: 16px; font-weight: 700; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conf-camp  { font-size: 12px; color: #aaa; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .conf-row   { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
    .conf-lbl   { font-size: 13px; color: #888; }
    .conf-val   { font-size: 14px; font-weight: 600; color: #262626; }
    .conf-total { font-size: 26px; font-weight: 700; color: #1677ff; }
    .conf-nums  {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;
    }
    .conf-num-chip {
      background: #e6f4ff; color: #1677ff; border-radius: 6px;
      padding: 3px 10px; font-size: 13px; font-weight: 700; border: 1px solid #91caff;
    }
    .conf-divider { border: none; border-top: 1px solid #f0f0f0; margin: 16px 0; }

    :host { display: block; }

    /* ── layout raiz ──────────────────────────────────── */
    .root {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 16px;
      align-items: stretch;
      height: calc(100vh - 198px);
      overflow: hidden;
    }

    /* ── painel esquerdo (desktop) ────────────────────── */
    .search-wrap { padding: 0 0 10px; }
    .participante-row { cursor: pointer; transition: background 0.15s; }
    .participante-row:hover td { background: #f5f5f5 !important; }
    .participante-row.ativo td { background: #e6f7ff !important; }
    .part-list-mobile { display: none; }

    /* ── painel direito ───────────────────────────────── */
    .right-col { display: flex; flex-direction: column; overflow: hidden; gap: 12px; }

    /* ── perfil ───────────────────────────────────────── */
    .perfil {
      flex-shrink: 0; display: flex; align-items: center; gap: 14px;
      padding: 14px 18px; background: #fafafa;
      border: 1px solid #f0f0f0; border-radius: 8px;
    }
    .avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: #1890ff; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 600; flex-shrink: 0;
    }
    .perfil-info { flex: 1; min-width: 0; }
    .perfil-info h3 { margin: 0; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .perfil-info p  { margin: 2px 0 0; font-size: 13px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ── conteúdo cartela + resumo ────────────────────── */
    .conteudo { display: grid; grid-template-columns: 1fr 260px; gap: 12px; flex: 1; min-height: 0; overflow: hidden; }

    /* ── cartela ──────────────────────────────────────── */
    .cartela { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; }
    .num-btn {
      width: 52px; height: 36px; font-size: 13px; font-weight: 500;
      border-radius: 4px; border: 1px solid #d9d9d9;
      cursor: pointer; transition: all 0.15s; background: #fff;
    }
    .num-btn.livre:hover { border-color: #1890ff; color: #1890ff; }
    .num-btn.selecionado { background: #1890ff; color: #fff; border-color: #1890ff; }
    .num-btn.vendido     { background: #f5f5f5; color: #bbb; border-color: #e8e8e8; cursor: not-allowed; }

    /* ── resumo (desktop) ─────────────────────────────── */
    .resumo-item  { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .resumo-total { font-size: 18px; font-weight: bold; color: #1890ff; }

    /* ── toolbar ──────────────────────────────────────── */
    .cartela-toolbar { display: flex; gap: 6px; align-items: center; margin-bottom: 10px; flex-shrink: 0; flex-wrap: wrap; }
    .toolbar-group   { display: flex; gap: 6px; align-items: center; }
    .toolbar-group.texto { flex: 1; min-width: 0; }
    .toolbar-group.texto input { flex: 1; min-width: 0; }
    .toolbar-group.auto { flex-shrink: 0; }

    /* ── empty state ──────────────────────────────────── */
    .empty-center { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: #bbb; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-txt  { font-size: 15px; }

    /* ── mobile back bar ──────────────────────────────── */
    .mobile-back {
      display: none; align-items: center; gap: 10px;
      flex-wrap: wrap;
      padding: 10px 0 14px;
    }
    .mobile-back .nome { font-weight: 600; font-size: 16px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* ── sticky confirm bar (mobile) ──────────────────── */
    .bar-confirmar {
      display: none;
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
      background: #fff;
      border-top: 1px solid #f0f0f0;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.1);
      padding: 12px 16px;
      align-items: center; gap: 12px;
    }
    .bar-confirmar .bc-info  { flex: 1; min-width: 0; }
    .bar-confirmar .bc-total { font-size: 20px; font-weight: 700; color: #1677ff; line-height: 1.1; }
    .bar-confirmar .bc-count {
      font-size: 12px; color: #999; margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* ── mobile participant list items ────────────────── */
    .part-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 4px; border-bottom: 1px solid #f5f5f5;
      cursor: pointer; transition: background 0.12s; border-radius: 6px;
    }
    .part-item:active { background: #f0f7ff; }
    .part-item.ativo  { background: #e6f7ff; }
    .part-item .pi-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #1890ff, #096dd9);
      color: #fff; font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
    }
    .part-item .pi-info { flex: 1; min-width: 0; }
    .part-item .pi-nome { font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .part-item .pi-cpf  { font-size: 12px; color: #aaa; margin-top: 1px; }
    .part-item .pi-arrow { color: #d9d9d9; font-size: 12px; flex-shrink: 0; }

    /* ── mobile overrides ─────────────────────────────── */
    @media (max-width: 768px) {
      .root      { grid-template-columns: 1fr; height: auto; overflow: visible; }
      .right-col { overflow: visible; gap: 0; }
      .conteudo  { grid-template-columns: 1fr; overflow: visible; gap: 0; }

      /* step navigation */
      .painel-left.tem-participante { display: none; }
      .painel-right { display: none; }
      .painel-right.tem-participante {
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 54px;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        background: #fff;
        padding-top: 54px;
        padding-bottom: calc(220px + env(safe-area-inset-bottom, 0px));
      }
      .bar-confirmar {
        display: flex;
        bottom: calc(56px + env(safe-area-inset-bottom, 0px));
      }

      /* participant list */
      .part-table-wrap  { display: none; }
      .part-list-mobile { display: block; }
      .search-wrap      { padding-bottom: 4px; }

      /* hide desktop-only */
      .perfil      { display: none; }
      .resumo-card { display: none; }

      /* ── mobile back bar: fixed below app topbar ── */
      .mobile-back {
        display: flex;
        position: fixed;
        top: 54px; left: 0; right: 0;
        z-index: 99;
        background: #fff;
        border-bottom: 1px solid #f0f0f0;
        padding: 10px 12px;
      }
      .mobile-back .nome { font-size: 15px; font-weight: 600; }

      /* ── cartela section: flat, no card ── */
      .cartela-section {
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        height: auto !important;
        overflow: visible !important;
      }
      /* hide card header — stats strip replaces it */
      .cartela-section ::ng-deep .ant-card-head { display: none !important; }
      .cartela-section ::ng-deep .ant-card-body {
        padding: 0 !important;
        display: flex; flex-direction: column;
        overflow: visible !important;
        flex: unset !important;
        min-height: unset !important;
      }

      /* cartela flows naturally; outer panel scrolls */
      .cartela {
        overflow-y: visible !important;
        min-height: unset !important;
        flex: unset !important;
      }

      /* ── stats pills row ── */
      .cartela-stats {
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        background: #f8f9fb;
        border-bottom: 1px solid #f0f0f0;
        flex-shrink: 0;
      }
      .cartela-stats .pill {
        display: inline-flex; align-items: center; gap: 5px;
        background: #fff; border-radius: 20px;
        padding: 4px 10px; font-size: 12px; font-weight: 500;
        border: 1px solid #e8e8e8; color: #555;
      }
      .cartela-stats .pill strong { font-weight: 700; }
      .cartela-stats .pill.sel { border-color: #91caff; background: #e6f4ff; color: #1677ff; }

      /* ── toolbar: compact single-section ── */
      .cartela-toolbar {
        flex-direction: column;
        background: #fff;
        padding: 10px 12px;
        gap: 8px;
        border-bottom: 1px solid #f0f0f0;
        margin: 0;
      }
      .toolbar-group { width: 100%; }
      .toolbar-group.texto { flex: unset; }
      .toolbar-group.texto input { flex: 1; font-size: 14px; }
      .toolbar-group.auto  { display: flex; align-items: center; gap: 8px; }
      .toolbar-group.auto nz-input-number { flex-shrink: 0; }
      .toolbar-group.auto button:first-of-type { flex: 1; }

      /* ── number grid ── */
      .cartela {
        display: grid !important;
        grid-template-columns: repeat(5, 1fr);
        gap: 7px;
        padding: 12px;
        margin-bottom: 5rem;
      }
      /* confirm bar visível: adiciona altura da barra (~68px) ao espaço */
      .cartela.com-barra { margin-bottom: 9rem; }
      .num-btn {
        width: 100%; height: 54px;
        font-size: 15px; font-weight: 700;
        border-radius: 12px;
        border: 1.5px solid #e8e8e8;
        background: #fff; color: #262626;
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .num-btn.livre:active { transform: scale(0.93); background: #e6f4ff; border-color: #91caff; }
      .num-btn.selecionado {
        background: linear-gradient(135deg, #1677ff, #0958d9);
        border-color: transparent;
        color: #fff;
        box-shadow: 0 4px 12px rgba(22,119,255,0.45);
        transform: scale(0.96);
      }
      .num-btn.vendido {
        background: #f5f5f5; color: #d0d0d0;
        border-color: #f0f0f0; cursor: not-allowed;
      }
    }
  `],
  template: `
    <nz-page-header
      [nzTitle]="'Venda — ' + campanha.nome"
      [nzSubtitle]="'R$ ' + campanha.valorCarne + ' · ' + campanha.numParcelas + 'x parcelas'" />

    <div class="root">

      <!-- ═══════════════ PAINEL ESQUERDO ═══════════════ -->
      <nz-card nzSize="small" nzTitle="Participantes" style="overflow:auto"
               class="painel-left" [class.tem-participante]="!!participanteId">

        <!-- Busca -->
        <div class="search-wrap">
          <nz-input-group [nzSuffix]="icBusca">
            <input nz-input [(ngModel)]="busca" [ngModelOptions]="{standalone:true}"
                   placeholder="Nome, CPF ou telefone" (input)="onBuscaInput($event)" />
          </nz-input-group>
          <ng-template #icBusca><span nz-icon nzType="search"></span></ng-template>
        </div>

        <!-- Tabela (desktop) -->
        <div class="part-table-wrap">
          <nz-table #tbPart [nzData]="participantes" [nzLoading]="buscandoParticipante"
                    nzSize="small" [nzShowPagination]="participantes.length > 10"
                    [nzPageSize]="10" [nzNoResult]="semPart">
            <thead><tr>
              <th>Nome</th>
              <th nzWidth="90px" style="color:#aaa">CPF</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let p of tbPart.data" class="participante-row"
                  [class.ativo]="p.id === participanteId" (click)="selecionarParticipante(p)">
                <td>{{ p.nome }}</td>
                <td style="font-size:11px; color:#aaa">{{ p.cpf || '—' }}</td>
              </tr>
            </tbody>
          </nz-table>
        </div>

        <!-- Lista touch (mobile) -->
        <div class="part-list-mobile">
          <nz-spin *ngIf="buscandoParticipante" style="display:block;text-align:center;padding:32px" />
          <ng-container *ngIf="!buscandoParticipante">
            <p *ngIf="participantes.length === 0"
               style="text-align:center;color:#ccc;padding:24px 0;font-size:13px">Nenhum resultado</p>
            <div *ngFor="let p of participantes" class="part-item"
                 [class.ativo]="p.id === participanteId"
                 (click)="selecionarParticipante(p)">
              <div class="pi-avatar">{{ iniciaisParticipante(p) }}</div>
              <div class="pi-info">
                <div class="pi-nome">{{ p.nome }}</div>
                <div class="pi-cpf" *ngIf="p.cpf">{{ p.cpf }}</div>
              </div>
              <span nz-icon nzType="right" class="pi-arrow"></span>
            </div>
          </ng-container>
        </div>

        <ng-template #semPart>
          <p style="text-align:center;color:#ccc;padding:16px 0;font-size:13px">Nenhum resultado</p>
        </ng-template>
      </nz-card>

      <!-- ═══════════════ PAINEL DIREITO ═══════════════ -->
      <div class="right-col painel-right" [class.tem-participante]="!!participanteId">

        <!-- Header mobile -->
        <div class="mobile-back" *ngIf="participanteId">
          <button nz-button nzType="text" (click)="deselecionar()"
                  style="padding:0 4px; margin-right:2px; flex-shrink:0">
            <span nz-icon nzType="arrow-left" style="font-size:18px"></span>
          </button>
          <div class="nome">{{ participanteSelecionado?.nome }}</div>
          <span style="font-size:12px; color:#aaa; flex-shrink:0; margin-left:8px">
            {{ campanha.valorCarne | brl }} · {{ campanha.numParcelas }}x
          </span>
        </div>

        <!-- Nenhum participante selecionado -->
        <div *ngIf="!participanteId" class="empty-center">
          <span class="empty-icon" nz-icon nzType="user" nzTheme="outline"></span>
          <p class="empty-txt">Selecione um participante à esquerda</p>
        </div>

        <!-- Participante selecionado -->
        <ng-container *ngIf="participanteId">

          <!-- Perfil (desktop only) -->
          <div class="perfil">
            <div class="avatar">{{ iniciais }}</div>
            <div class="perfil-info">
              <h3>{{ participanteSelecionado?.nome }}</h3>
              <p>{{ participanteSelecionado?.telefone || participanteSelecionado?.cpf || 'Sem contato' }}</p>
            </div>
          </div>

          <nz-spin *ngIf="carregandoCartela" nzTip="Carregando cartela..." style="display:block;text-align:center;padding:40px" />

          <div *ngIf="!carregandoCartela" class="conteudo">

            <!-- CARTELA -->
            <nz-card nzSize="small" nzTitle="Cartela de números" class="cartela-section"
                     style="height:100%; display:flex; flex-direction:column; overflow:hidden"
                     [nzBodyStyle]="{ 'flex': '1', 'min-height': '0', 'overflow': 'hidden', 'display': 'flex', 'flex-direction': 'column', 'padding': '12px' }">
              <ng-template #cardExtra>
                <span style="color:#888; font-size:12px">
                  {{ numerosLivres.length }} livre(s) · {{ numerosVendidos.size }} vendido(s)
                </span>
              </ng-template>

              <!-- Stats pills (mobile only) -->
              <div class="cartela-stats">
                <span class="pill">
                  <strong style="color:#1677ff">{{ numerosLivres.length }}</strong> livres
                </span>
                <span class="pill">
                  <strong style="color:#bbb">{{ numerosVendidos.size }}</strong> vendidos
                </span>
                <span class="pill sel" *ngIf="selecionados.size > 0">
                  <strong>{{ selecionados.size }}</strong> selecionado(s)
                </span>
              </div>

              <div class="cartela-toolbar">
                <div class="toolbar-group texto">
                  <input nz-input nzSize="small"
                    placeholder="Números por vírgula (ex: 3, 17, 42)"
                    [(ngModel)]="inputNumerosTexto"
                    (keydown.enter)="adicionarPorTexto()" />
                  <button nz-button nzSize="small" (click)="adicionarPorTexto()">Adicionar</button>
                </div>
                <div class="toolbar-group auto">
                  <nz-input-number [(ngModel)]="quantidadeAuto"
                    [nzMin]="1" [nzMax]="50" [nzStep]="1" [nzPrecision]="0"
                    nzSize="small" style="width:64px; flex-shrink:0" />
                  <button nz-button nzSize="small" (click)="pegarProximos()">
                    <span nz-icon nzType="thunderbolt"></span> Próximos
                  </button>
                  <button nz-button nzSize="small" nzDanger (click)="limparSelecao()"
                          *ngIf="selecionados.size > 0">
                    <span nz-icon nzType="close"></span> Limpar
                  </button>
                </div>
              </div>

              <div class="cartela" [class.com-barra]="selecionados.size > 0" style="flex:1; min-height:0; overflow-y:auto">
                <button *ngFor="let n of todosNumeros" class="num-btn"
                  [class.vendido]="numerosVendidos.has(n)"
                  [class.selecionado]="selecionados.has(n)"
                  [class.livre]="!numerosVendidos.has(n) && !selecionados.has(n)"
                  [disabled]="numerosVendidos.has(n)"
                  (click)="toggleNumero(n)"
                  [nz-tooltip]="numerosVendidos.has(n) ? donos.get(n) : null">
                  {{ n }}
                </button>
              </div>
            </nz-card>

            <!-- RESUMO (desktop only) -->
            <nz-card nzSize="small" nzTitle="Resumo da venda" class="resumo-card">
              <div class="resumo-item">
                <span>Carnês selecionados</span>
                <strong>{{ selecionados.size }}</strong>
              </div>
              <div class="resumo-item">
                <span>Valor por carnê</span>
                <span>{{ campanha.valorCarne | brl }}</span>
              </div>
              <nz-divider />
              <div class="resumo-item">
                <span>Total</span>
                <span class="resumo-total">{{ total | brl }}</span>
              </div>
              <nz-divider />
              <button nz-button nzType="primary" nzBlock
                [disabled]="selecionados.size === 0"
                (click)="abrirConfirmacao()">
                Revisar e confirmar
              </button>
              <div *ngIf="selecionados.size > 0"
                   style="margin-top:12px; font-size:12px; color:#888; word-break:break-all">
                Números: {{ listaNumerosSelecionados }}
              </div>
            </nz-card>

          </div>
        </ng-container>
      </div>
    </div>

    <!-- ═══════ BARRA FIXA DE CONFIRMAÇÃO (mobile) ═══════ -->
    <div class="bar-confirmar" *ngIf="participanteId && selecionados.size > 0">
      <div class="bc-info">
        <div class="bc-total">{{ total | brl }}</div>
        <div class="bc-count">
          {{ selecionados.size }} carnê(s) — nº {{ listaNumerosSelecionados }}
        </div>
      </div>
      <button nz-button nzType="primary" nzSize="large"
              (click)="abrirConfirmacao()"
              style="flex-shrink:0">
        Confirmar
      </button>
    </div>

    <!-- ══════════ MODAL DE CONFIRMAÇÃO DE VENDA ══════════ -->
    <nz-modal
      [(nzVisible)]="confirmarVisivel"
      nzTitle="Confirmar venda"
      [nzOkText]="'Confirmar venda'"
      nzCancelText="Voltar e revisar"
      [nzOkLoading]="vendendo"
      (nzOnOk)="confirmarVenda()"
      (nzOnCancel)="confirmarVisivel = false"
      nzWidth="480px">
      <ng-container *nzModalContent>

        <!-- Participante -->
        <div class="conf-header">
          <div class="conf-avatar">{{ iniciais }}</div>
          <div style="flex:1; min-width:0">
            <div class="conf-nome">{{ participanteSelecionado?.nome }}</div>
            <div class="conf-camp">{{ campanha.nome }}</div>
          </div>
        </div>

        <!-- Detalhes -->
        <div class="conf-row">
          <span class="conf-lbl">Carnês selecionados</span>
          <span class="conf-val">{{ selecionados.size }}</span>
        </div>
        <div class="conf-row">
          <span class="conf-lbl">Valor por carnê</span>
          <span class="conf-val">{{ campanha.valorCarne | brl }}</span>
        </div>

        <hr class="conf-divider" />

        <div class="conf-row" style="align-items:center">
          <span class="conf-lbl" style="font-size:15px; font-weight:600; color:#1a1a1a">Total a receber</span>
          <span class="conf-total">{{ total | brl }}</span>
        </div>

        <hr class="conf-divider" />

        <div style="margin-bottom:8px; font-size:13px; color:#888">Números de sorte:</div>
        <div class="conf-nums">
          <span *ngFor="let n of numerosOrdenados" class="conf-num-chip">{{ n }}</span>
        </div>

      </ng-container>
    </nz-modal>
  `,
})
export class CarnesVendaComponent implements OnInit {
  campanhaAtiva = inject(CampanhaAtivaService);

  get campanha() { return this.campanhaAtiva.campanha()!; }

  todosNumeros: number[] = [];
  numerosLivres: number[] = [];
  numerosVendidos = new Map<number, boolean>();
  donos = new Map<number, string>();
  selecionados = new Set<number>();

  participantes: any[] = [];
  participanteId: string | null = null;
  participanteSelecionado: any = null;
  busca = '';

  inputNumerosTexto = '';
  quantidadeAuto = 1;
  carregandoCartela = false;
  buscandoParticipante = false;
  vendendo = false;
  confirmarVisivel = false;

  private buscaSubject = new Subject<string>();

  constructor(
    private api: ApiService,
    private message: NzMessageService,
    private el: ElementRef,
  ) {}

  ngOnInit() {
    this.carregarParticipantes();

    this.buscaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(busca => {
        this.buscandoParticipante = true;
        return this.api.get<any[]>('participantes', busca ? { busca } : undefined);
      }),
    ).subscribe({
      next: (data) => { this.participantes = data; this.buscandoParticipante = false; },
      error: () => { this.buscandoParticipante = false; },
    });
  }

  carregarParticipantes() {
    this.buscandoParticipante = true;
    this.api.get<any[]>('participantes').subscribe({
      next: (data) => { this.participantes = data; this.buscandoParticipante = false; },
      error: () => { this.buscandoParticipante = false; },
    });
  }

  onBusca() { this.buscaSubject.next(this.busca); }

  onBuscaInput(event: Event) {
    this.busca = (event.target as HTMLInputElement).value;
    this.buscaSubject.next(this.busca);
  }

  selecionarParticipante(p: any) {
    if (p.id === this.participanteId) return;
    this.participanteId = p.id;
    this.participanteSelecionado = p;
    this.selecionados = new Set();
    this.carregarCartela();
  }

  deselecionar() {
    this.participanteId = null;
    this.participanteSelecionado = null;
    this.selecionados = new Set();
  }

  carregarCartela() {
    const campanhaId = this.campanha.id;
    this.carregandoCartela = true;

    this.api.get<any[]>('carnes', { campanhaId }).subscribe(carnes => {
      this.numerosVendidos.clear();
      this.donos.clear();
      carnes.forEach(c => {
        this.numerosVendidos.set(c.numeroSorte, true);
        this.donos.set(c.numeroSorte, c.participante?.nome ?? 'Vendido');
      });
    });

    this.api.get<number[]>('carnes/numeros-livres', { campanhaId }).subscribe({
      next: livres => {
        this.numerosLivres = livres;
        this.todosNumeros = Array.from({ length: this.campanha.maxCarnes }, (_, i) => i + 1);
        this.carregandoCartela = false;
      },
      error: () => { this.carregandoCartela = false; },
    });
  }

  toggleNumero(n: number) {
    if (this.numerosVendidos.has(n)) return;
    const eraVazio = this.selecionados.size === 0;
    if (this.selecionados.has(n)) this.selecionados.delete(n);
    else this.selecionados.add(n);
    this.selecionados = new Set(this.selecionados);
    if (eraVazio && this.selecionados.size === 1) {
      setTimeout(() => {
        const panel = this.el.nativeElement.querySelector('.painel-right') as HTMLElement;
        panel?.scrollBy({ top: 80, behavior: 'smooth' });
      }, 50);
    }
  }

  adicionarPorTexto() {
    if (!this.inputNumerosTexto.trim()) return;
    this.inputNumerosTexto.split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= this.campanha.maxCarnes && !this.numerosVendidos.has(n))
      .forEach(n => this.selecionados.add(n));
    this.selecionados = new Set(this.selecionados);
    this.inputNumerosTexto = '';
  }

  pegarProximos() {
    this.numerosLivres
      .filter(n => !this.selecionados.has(n))
      .slice(0, this.quantidadeAuto)
      .forEach(n => this.selecionados.add(n));
    this.selecionados = new Set(this.selecionados);
  }

  limparSelecao() { this.selecionados = new Set(); }

  get iniciais(): string {
    return this.iniciaisParticipante(this.participanteSelecionado);
  }

  iniciaisParticipante(p: any): string {
    const nome: string = p?.nome ?? '';
    return nome.split(' ').slice(0, 2).map((s: string) => s[0]).join('').toUpperCase();
  }

  get total(): number {
    return this.selecionados.size * Number(this.campanha.valorCarne);
  }

  get listaNumerosSelecionados(): string {
    return Array.from(this.selecionados).sort((a, b) => a - b).join(', ');
  }

  get numerosOrdenados(): number[] {
    return Array.from(this.selecionados).sort((a, b) => a - b);
  }

  abrirConfirmacao() {
    if (!this.participanteId || this.selecionados.size === 0) return;
    this.confirmarVisivel = true;
  }

  confirmarVenda() {
    if (!this.participanteId || this.selecionados.size === 0) return;
    this.vendendo = true;
    this.api.post<any>('carnes/vender', {
      campanhaId: this.campanha.id,
      participanteId: this.participanteId,
      numerosSorte: Array.from(this.selecionados),
    }).subscribe({
      next: () => {
        this.message.success(`${this.selecionados.size} carnê(s) vendido(s) com sucesso!`);
        this.confirmarVisivel = false;
        this.selecionados = new Set();
        this.carregarCartela();
        this.vendendo = false;
      },
      error: (err) => {
        this.message.error(err?.error?.message ?? 'Erro ao registrar venda');
        this.vendendo = false;
      },
    });
  }
}
