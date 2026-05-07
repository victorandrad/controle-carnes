import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiService } from '../shared/services/api.service';
import { BrlPipe } from '../shared/pipes/brl.pipe';
import { AuthService } from '../auth/auth.service';
import { CampanhaAtivaService } from '../shared/services/campanha-ativa.service';

@Component({
  selector: 'app-campanhas-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzAlertModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule,
    NzDividerModule,
    NzPopconfirmModule,
    NzToolTipModule,
    BrlPipe,
  ],
  styles: [`
    /* ── page / topbar ───────────────────────────────── */
    .page { min-height: 100vh; background: #f5f6fa; }
    .topbar {
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
      box-shadow: 0 1px 4px rgba(0,21,41,.06);
      padding: 0 24px;
      min-height: 56px;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .topbar-left  { display: flex; align-items: center; gap: 12px; }
    .topbar-title { font-size: 16px; font-weight: 600; color: #1a1a1a; }
    .topbar-sub   { font-size: 13px; color: #888; }
    .page-body    { padding: 24px; }

    /* ── stats ───────────────────────────────────────── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #fff; border-radius: 8px;
      padding: 16px 20px; border: 1px solid #f0f0f0;
      display: flex; align-items: center; gap: 14px;
    }
    .stat-icon {
      width: 44px; height: 44px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .stat-val { font-size: 22px; font-weight: 700; line-height: 1; }
    .stat-lbl { font-size: 13px; color: #888; margin-top: 4px; }

    /* ── tabela (desktop) ────────────────────────────── */
    .nome-cell   { font-weight: 600; }
    .premio-cell { font-size: 12px; color: #888; margin-top: 2px; }
    .actions     { display: flex; align-items: center; gap: 4px; }
    .table-wrap  { background: #fff; border-radius: 8px; border: 1px solid #f0f0f0; overflow: hidden; }
    .cards-wrap  { display: none; }

    /* ── campaign cards (mobile) ─────────────────────── */
    .cc {
      background: #fff; border-radius: 12px;
      border: 1px solid #f0f0f0;
      margin-bottom: 12px; overflow: hidden;
    }
    .cc-head {
      padding: 14px 16px 10px;
      display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
    }
    .cc-nome  { font-size: 15px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
    .cc-premio {
      font-size: 12px; color: #888; margin-top: 4px;
      display: flex; align-items: center; gap: 4px;
    }
    .cc-meta {
      display: grid; grid-template-columns: 1fr 1fr;
      border-top: 1px solid #f5f5f5;
    }
    .cc-meta-item {
      padding: 9px 16px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .cc-meta-item:nth-child(odd) { border-right: 1px solid #f5f5f5; }
    .cc-meta-item:nth-child(n+3) { border-top: 1px solid #f5f5f5; }
    .cc-meta-lbl { font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: .4px; }
    .cc-meta-val { font-size: 14px; font-weight: 600; color: #262626; }
    .cc-meta-val.blue { color: #1890ff; }
    .cc-meta-val.sold { color: #52c41a; }
    .cc-foot {
      border-top: 1px solid #f5f5f5;
      display: flex; gap: 0;
    }
    .cc-foot button {
      flex: 1; border-radius: 0 !important;
      border: none !important; border-right: 1px solid #f5f5f5 !important;
      height: 44px !important; font-size: 13px !important;
    }
    .cc-foot button:last-child { border-right: none !important; }
    .cc-encerrada { opacity: .7; }

    /* ── readonly info ───────────────────────────────── */
    .readonly-info {
      background: #fffbe6; border: 1px solid #ffe58f;
      border-radius: 6px; padding: 10px 14px;
      font-size: 12px; color: #7c5800; margin-bottom: 12px;
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
      .topbar { padding: 0 12px; min-height: 52px; }
      .topbar-sub { display: none; }
      .topbar-title { font-size: 14px; }
      .page-body { padding: 12px; }
      .stats-row {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px; margin-bottom: 14px;
      }
      .stat-card { padding: 10px 12px; gap: 8px; }
      .stat-icon { width: 32px; height: 32px; font-size: 14px; border-radius: 7px; }
      .stat-val  { font-size: 18px; }
      .stat-lbl  { font-size: 11px; }
      .table-wrap { display: none; }
      .cards-wrap { display: block; }
    }
  `],
  template: `
    <div class="page">

    <!-- Topbar -->
    <div class="topbar">
      <div class="topbar-left">
        <button nz-button nzType="text" nzSize="small" (click)="voltar()">
          <span nz-icon nzType="arrow-left"></span> Voltar
        </button>
        <nz-divider nzType="vertical"></nz-divider>
        <span class="topbar-title">Campanhas</span>
        <span class="topbar-sub">Gerencie as campanhas de sorteio</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button nz-button nzType="primary" nzSize="small" (click)="abrirCriar()">
          <span nz-icon nzType="plus"></span> Nova
        </button>
        <button nz-button nzType="text" style="color:#aaa" nzSize="small" (click)="confirmarLogout()">
          <span nz-icon nzType="logout"></span>
        </button>
      </div>
    </div>

    <div class="page-body">

    <!-- Stats -->
    <div class="stats-row" *ngIf="!carregando && campanhas.length > 0">
      <div class="stat-card">
        <div class="stat-icon" style="background:#e6f7ff; color:#1890ff">
          <span nz-icon nzType="trophy"></span>
        </div>
        <div>
          <div class="stat-val">{{ campanhas.length }}</div>
          <div class="stat-lbl">Total</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f6ffed; color:#52c41a">
          <span nz-icon nzType="check-circle"></span>
        </div>
        <div>
          <div class="stat-val" style="color:#52c41a">{{ qtdAtivas }}</div>
          <div class="stat-lbl">Ativas</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f5f5f5; color:#aaa">
          <span nz-icon nzType="clock-circle"></span>
        </div>
        <div>
          <div class="stat-val" style="color:#aaa">{{ qtdEncerradas }}</div>
          <div class="stat-lbl">Encerradas</div>
        </div>
      </div>
    </div>

    <!-- Tabela (desktop) -->
    <div class="table-wrap">
      <nz-spin *ngIf="carregando" nzTip="Carregando..." style="display:block; text-align:center; padding:48px" />
      <nz-table *ngIf="!carregando" #tb [nzData]="campanhas"
                [nzShowPagination]="campanhas.length > 10" nzSize="middle">
        <thead>
          <tr>
            <th>Campanha</th>
            <th nzWidth="120px">Data sorteio</th>
            <th nzWidth="120px">Valor carnê</th>
            <th nzWidth="90px">Parcelas</th>
            <th nzWidth="110px">Máx. carnês</th>
            <th nzWidth="90px">Status</th>
            <th nzWidth="120px"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of tb.data">
            <td>
              <div class="nome-cell">{{ c.nome }}</div>
              <div class="premio-cell">
                <span nz-icon nzType="trophy" style="color:#faad14; margin-right:4px; font-size:11px"></span>
                {{ c.premio }}
              </div>
            </td>
            <td style="color:#555">{{ c.dataSorteio | date:'dd/MM/yyyy':'UTC' }}</td>
            <td style="font-weight:600; color:#1890ff">{{ c.valorCarne | brl }}</td>
            <td style="color:#555; text-align:center">{{ c.numParcelas }}x</td>
            <td style="color:#555; text-align:center">{{ c.maxCarnes }}</td>
            <td>
              <nz-tag [nzColor]="c.status === 'ativa' ? 'success' : 'default'">
                {{ c.status === 'ativa' ? 'Ativa' : 'Encerrada' }}
              </nz-tag>
            </td>
            <td>
              <div class="actions">
                <button nz-button nzType="text" nzSize="small"
                        [disabled]="c.status === 'encerrada'"
                        [nz-tooltip]="c.status === 'encerrada' ? 'Campanha encerrada' : 'Editar'"
                        (click)="abrirEdicao(c)">
                  <span nz-icon nzType="edit"></span>
                </button>
                <button nz-button nzType="text" nzSize="small" style="color:#fa8c16"
                        nz-popconfirm nzPopconfirmTitle="Encerrar esta campanha? Esta ação não pode ser desfeita."
                        nzPopconfirmPlacement="left" (nzOnConfirm)="encerrar(c)"
                        [disabled]="c.status === 'encerrada'"
                        [nz-tooltip]="c.status === 'encerrada' ? 'Já encerrada' : 'Encerrar'">
                  <span nz-icon nzType="close-circle"></span>
                </button>
                <button nz-button nzType="text" nzSize="small" style="color:#ff4d4f"
                        nz-popconfirm nzPopconfirmTitle="Excluir esta campanha? Só é possível se nenhum carnê foi vendido."
                        nzPopconfirmPlacement="left" (nzOnConfirm)="excluir(c)"
                        nz-tooltip="Excluir campanha">
                  <span nz-icon nzType="close"></span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </nz-table>
      <nz-empty *ngIf="!carregando && campanhas.length === 0"
        nzNotFoundContent="Nenhuma campanha cadastrada. Crie a primeira!" style="padding:48px" />
    </div>

    <!-- Cards (mobile) -->
    <div class="cards-wrap">
      <nz-spin *ngIf="carregando" style="display:block; text-align:center; padding:48px" />
      <nz-empty *ngIf="!carregando && campanhas.length === 0"
        nzNotFoundContent="Nenhuma campanha. Toque em + Nova para começar."
        style="padding:48px; background:#fff; border-radius:12px" />

      <div *ngFor="let c of campanhas" class="cc" [class.cc-encerrada]="c.status === 'encerrada'">

        <!-- Cabeçalho -->
        <div class="cc-head">
          <div style="flex:1; min-width:0">
            <div class="cc-nome">{{ c.nome }}</div>
            <div class="cc-premio">
              <span nz-icon nzType="trophy" style="color:#faad14"></span>
              {{ c.premio }}
            </div>
          </div>
          <nz-tag [nzColor]="c.status === 'ativa' ? 'success' : 'default'" style="flex-shrink:0">
            {{ c.status === 'ativa' ? 'Ativa' : 'Encerrada' }}
          </nz-tag>
        </div>

        <!-- Meta grid 2×3 -->
        <div class="cc-meta">
          <div class="cc-meta-item">
            <span class="cc-meta-lbl">Sorteio</span>
            <span class="cc-meta-val">{{ c.dataSorteio | date:'dd/MM/yyyy':'UTC' }}</span>
          </div>
          <div class="cc-meta-item">
            <span class="cc-meta-lbl">Valor do carnê</span>
            <span class="cc-meta-val blue">{{ c.valorCarne | brl }}</span>
          </div>
          <div class="cc-meta-item">
            <span class="cc-meta-lbl">Parcelas</span>
            <span class="cc-meta-val">{{ c.numParcelas }}x</span>
          </div>
          <div class="cc-meta-item">
            <span class="cc-meta-lbl">Máx. carnês</span>
            <span class="cc-meta-val">{{ c.maxCarnes }}</span>
          </div>
          <div class="cc-meta-item" style="grid-column:span 2">
            <span class="cc-meta-lbl">Carnês vendidos</span>
            <span class="cc-meta-val sold">{{ c.carnesVendidos ?? 0 }}</span>
          </div>
        </div>

        <!-- Ações -->
        <div class="cc-foot">
          <button nz-button nzType="text"
                  [disabled]="c.status === 'encerrada'"
                  (click)="abrirEdicao(c)">
            <span nz-icon nzType="edit"></span> Editar
          </button>
          <button nz-button nzType="text" style="color:#fa8c16"
                  nz-popconfirm
                  nzPopconfirmTitle="Encerrar esta campanha? Não poderá ser desfeito."
                  nzPopconfirmPlacement="top"
                  (nzOnConfirm)="encerrar(c)"
                  [disabled]="c.status === 'encerrada'">
            <span nz-icon nzType="close-circle"></span> Encerrar
          </button>
          <button nz-button nzType="text" style="color:#ff4d4f"
                  nz-popconfirm
                  nzPopconfirmTitle="Excluir campanha? Só é possível sem carnês vendidos."
                  nzPopconfirmPlacement="top"
                  (nzOnConfirm)="excluir(c)">
            <span nz-icon nzType="delete"></span> Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- ══ Modal: Nova Campanha ══ -->
    <nz-modal
      [(nzVisible)]="criarVisivel"
      nzTitle="Nova Campanha"
      [nzOkLoading]="salvando"
      (nzOnOk)="salvarCriar()"
      (nzOnCancel)="criarVisivel = false"
      nzOkText="Criar Campanha"
      nzCancelText="Cancelar"
      nzWidth="560px">
      <ng-container *nzModalContent>
        <form nz-form [formGroup]="criarForm" nzLayout="vertical">

          <nz-form-item>
            <nz-form-label nzRequired>Nome da campanha</nz-form-label>
            <nz-form-control nzErrorTip="Informe o nome">
              <input nz-input formControlName="nome" placeholder="Ex: Sorteio do Carro 2026" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Prêmio</nz-form-label>
            <nz-form-control nzErrorTip="Informe o prêmio">
              <input nz-input formControlName="premio" placeholder="Ex: Volkswagen Polo 0km" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Data do sorteio</nz-form-label>
            <nz-form-control nzErrorTip="Informe a data">
              <nz-date-picker formControlName="dataSorteio" nzFormat="dd/MM/yyyy"
                              style="width:100%" [nzDisabledDate]="dataPassada" />
            </nz-form-control>
          </nz-form-item>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px">
            <nz-form-item>
              <nz-form-label nzRequired>Valor do carnê</nz-form-label>
              <nz-form-control [nzValidateStatus]="criarForm.get('valorCarne')!" nzErrorTip="Informe o valor">
                <nz-input-group nzPrefix="R$">
                  <input nz-input type="text" inputmode="numeric" placeholder="0,00"
                         [value]="valorCarneDisplay"
                         (input)="mascaraValorBRL($event)" />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Nº de parcelas</nz-form-label>
              <nz-form-control nzErrorTip="Informe as parcelas">
                <nz-input-number formControlName="numParcelas"
                  [nzMin]="1" [nzStep]="1" [nzPrecision]="0" style="width:100%" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Máx. de carnês</nz-form-label>
              <nz-form-control nzErrorTip="Informe o máximo">
                <nz-input-number formControlName="maxCarnes"
                  [nzMin]="1" [nzStep]="50" [nzPrecision]="0" style="width:100%" />
              </nz-form-control>
            </nz-form-item>
          </div>

          <nz-alert *ngIf="avisoDivisao" nzType="warning" nzShowIcon
            nzMessage="Divisão quebrada: o valor por parcela não é exato."
            style="margin-top:4px" />

          <div *ngIf="valorParcelaCriar > 0 && !avisoDivisao"
               style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;padding:10px 14px;margin-top:4px;font-size:13px;color:#389e0d">
            <span nz-icon nzType="check-circle" style="margin-right:6px"></span>
            Valor por parcela: <strong>{{ valorParcelaCriar | brl }}</strong>
          </div>
        </form>
      </ng-container>
    </nz-modal>

    <!-- ══ Modal: Editar Campanha ══ -->
    <nz-modal
      [(nzVisible)]="editarVisivel"
      nzTitle="Editar Campanha"
      [nzOkLoading]="salvando"
      (nzOnOk)="salvarEdicao()"
      (nzOnCancel)="editarVisivel = false"
      nzOkText="Salvar"
      nzCancelText="Cancelar"
      nzWidth="520px">
      <ng-container *nzModalContent>
        <div class="readonly-info">
          <span nz-icon nzType="warning" style="margin-right:6px"></span>
          <strong>Valor do carnê</strong> e <strong>número de parcelas</strong> não podem ser alterados após a criação — impactariam os carnês já vendidos.
        </div>
        <form nz-form [formGroup]="editForm" nzLayout="vertical">

          <nz-form-item>
            <nz-form-label nzRequired>Nome da campanha</nz-form-label>
            <nz-form-control nzErrorTip="Informe o nome">
              <input nz-input formControlName="nome" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Prêmio</nz-form-label>
            <nz-form-control nzErrorTip="Informe o prêmio">
              <input nz-input formControlName="premio" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Data do sorteio</nz-form-label>
            <nz-form-control nzErrorTip="Informe a data">
              <nz-date-picker formControlName="dataSorteio" nzFormat="dd/MM/yyyy"
                              style="width:100%" [nzDisabledDate]="dataPassada" />
            </nz-form-control>
          </nz-form-item>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <nz-form-item>
              <nz-form-label>Valor do carnê</nz-form-label>
              <nz-form-control>
                <nz-input-group nzPrefix="R$">
                  <input nz-input [value]="editandoCampanha?.valorCarne | brl" disabled />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Nº de parcelas</nz-form-label>
              <nz-form-control>
                <input nz-input [value]="editandoCampanha?.numParcelas + 'x'" disabled />
              </nz-form-control>
            </nz-form-item>
          </div>

          <nz-form-item>
            <nz-form-label nzRequired>Máx. de carnês</nz-form-label>
            <nz-form-control [nzErrorTip]="'Mínimo permitido: ' + (editandoCampanha?.carnesVendidos || 1)">
              <nz-input-number formControlName="maxCarnes"
                [nzMin]="editandoCampanha?.carnesVendidos || 1"
                [nzStep]="50" [nzPrecision]="0" style="width:100%" />
            </nz-form-control>
            <div *ngIf="editandoCampanha?.carnesVendidos > 0"
                 style="font-size:12px; color:#888; margin-top:4px">
              <span nz-icon nzType="warning" style="color:#faad14; margin-right:4px"></span>
              {{ editandoCampanha.carnesVendidos }} carnê(s) já vendidos — não é possível reduzir abaixo desse valor.
            </div>
          </nz-form-item>

        </form>
      </ng-container>
    </nz-modal>

    </div><!-- /page-body -->
    </div><!-- /page -->

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
export class CampanhasListComponent implements OnInit {
  auth = inject(AuthService);
  campanhaAtiva = inject(CampanhaAtivaService);
  private router = inject(Router);

  campanhas: any[] = [];
  carregando = true;
  salvando = false;
  avisoDivisao = false;
  valorCarneDisplay = '';

  criarVisivel = false;
  editarVisivel = false;
  editandoCampanha: any = null;
  logoutVisivel = false;

  criarForm!: ReturnType<typeof this.buildCriarForm>;
  editForm!:  ReturnType<typeof this.buildEditForm>;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private message: NzMessageService,
  ) {
    this.criarForm = this.buildCriarForm();
    this.editForm  = this.buildEditForm();
    this.criarForm.valueChanges.subscribe(() => this.verificarDivisao());
  }

  private buildCriarForm() {
    return this.fb.group({
      nome:        ['', Validators.required],
      premio:      ['', Validators.required],
      dataSorteio: [null as Date | null, Validators.required],
      valorCarne:  [null as number | null, [Validators.required, Validators.min(0.01)]],
      numParcelas: [null as number | null, [Validators.required, Validators.min(1)]],
      maxCarnes:   [null as number | null, [Validators.required, Validators.min(1)]],
    });
  }

  private buildEditForm() {
    return this.fb.group({
      nome:        ['', Validators.required],
      premio:      ['', Validators.required],
      dataSorteio: [null as Date | null, Validators.required],
      maxCarnes:   [null as number | null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.get<any[]>('campanhas').subscribe({
      next: (data) => { this.campanhas = data; this.carregando = false; },
      error: () => { this.carregando = false; },
    });
  }

  get qtdAtivas()     { return this.campanhas.filter(c => c.status === 'ativa').length; }
  get qtdEncerradas() { return this.campanhas.filter(c => c.status === 'encerrada').length; }

  get valorParcelaCriar(): number {
    const { valorCarne, numParcelas } = this.criarForm.value;
    if (!valorCarne || !numParcelas || numParcelas <= 0) return 0;
    return valorCarne / numParcelas;
  }

  verificarDivisao() {
    const { valorCarne, numParcelas } = this.criarForm.value;
    this.avisoDivisao = !!(valorCarne && numParcelas && numParcelas > 0 &&
      (valorCarne * 100) % numParcelas !== 0);
  }

  dataPassada = (d: Date) => d < new Date(new Date().setHours(0, 0, 0, 0));

  mascaraValorBRL(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const num = parseInt(digits || '0', 10) / 100;
    const fmt = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    input.value = fmt;
    this.valorCarneDisplay = fmt;
    this.criarForm.patchValue({ valorCarne: num > 0 ? num : null });
  }

  confirmarLogout() { this.logoutVisivel = true; }

  voltar() { this.router.navigate(['/selecionar-campanha']); }

  abrirCriar() {
    this.criarForm.reset();
    this.valorCarneDisplay = '';
    this.avisoDivisao = false;
    this.criarVisivel = true;
  }

  salvarCriar() {
    if (this.criarForm.invalid) {
      Object.values(this.criarForm.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }
    const v = this.criarForm.value;
    this.salvando = true;
    this.api.post<any>('campanhas', {
      nome:        v.nome,
      premio:      v.premio,
      dataSorteio: (v.dataSorteio as Date).toISOString().slice(0, 10),
      valorCarne:  v.valorCarne,
      numParcelas: v.numParcelas,
      maxCarnes:   v.maxCarnes,
    }).subscribe({
      next: () => {
        this.message.success('Campanha criada com sucesso!');
        this.criarVisivel = false;
        this.carregar();
        this.salvando = false;
      },
      error: (err) => {
        this.message.error(err?.error?.message ?? 'Erro ao criar campanha');
        this.salvando = false;
      },
    });
  }

  abrirEdicao(c: any) {
    this.editandoCampanha = c;
    this.editForm.reset({
      nome:        c.nome,
      premio:      c.premio,
      dataSorteio: new Date(c.dataSorteio),
      maxCarnes:   c.maxCarnes,
    });
    this.editarVisivel = true;
  }

  salvarEdicao() {
    if (this.editForm.invalid) {
      Object.values(this.editForm.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }
    const v = this.editForm.value;
    this.salvando = true;
    this.api.patch<any>(`campanhas/${this.editandoCampanha.id}`, {
      nome:        v.nome,
      premio:      v.premio,
      dataSorteio: (v.dataSorteio as Date).toISOString().slice(0, 10),
      maxCarnes:   v.maxCarnes,
    }).subscribe({
      next: () => {
        this.message.success('Campanha atualizada!');
        this.editarVisivel = false;
        this.carregar();
        this.salvando = false;
      },
      error: (err) => {
        this.message.error(err?.error?.message ?? 'Erro ao atualizar campanha');
        this.salvando = false;
      },
    });
  }

  encerrar(c: any) {
    this.api.patch<any>(`campanhas/${c.id}/encerrar`, {}).subscribe({
      next: () => {
        this.message.success('Campanha encerrada.');
        if (this.campanhaAtiva.campanha()?.id === c.id) this.campanhaAtiva.limpar();
        this.carregar();
      },
      error: (err) => this.message.error(err?.error?.message ?? 'Erro ao encerrar'),
    });
  }

  excluir(c: any) {
    this.api.delete<any>(`campanhas/${c.id}`).subscribe({
      next: () => {
        this.message.success('Campanha excluída.');
        if (this.campanhaAtiva.campanha()?.id === c.id) this.campanhaAtiva.limpar();
        this.carregar();
      },
      error: (err) => this.message.error(err?.error?.message ?? 'Erro ao excluir'),
    });
  }
}
