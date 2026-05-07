# CLAUDE.md

> Documento de contexto para agentes de IA (Claude Code, Cursor, Copilot, etc.)
> trabalhando neste repositório. Leia este arquivo **antes** de propor qualquer
> mudança de schema, regra de negócio ou padrão arquitetural.

---

## 1. Visão Geral do Projeto

**Sistema de Gestão de Carnês para Igrejas** — aplicação web para igrejas
gerenciarem campanhas de sorteio (carro, prêmios diversos) em que fiéis compram
carnês parcelados e participam do sorteio se quitarem todas as parcelas até a
véspera da data do sorteio.

Substitui o controle atual feito em planilhas e papéis. Pagamentos chegam
predominantemente em dinheiro ou Pix.

**Usuários do sistema:**
- **Tesoureiro / Secretário** — registra pagamentos, cadastra participantes,
  gera carnês durante a campanha.
- **Administrador** — configura campanhas, vê relatórios consolidados, executa
  ou registra o sorteio.

**Não-objetivos (definitivos, fora do escopo):**
- Integração contábil com sistemas externos
- Multi-tenant — sistema é single-tenant, uma única igreja
- Aplicativo nativo mobile (a webapp deve ser responsiva)
- Notificações automáticas (WhatsApp/email/SMS) — não será implementado
- Sorteio no sistema — o sorteio é externo (Loteria Federal ou manual); o sistema não executa nem registra sorteio

---

## 2. Stack Técnica

| Camada              | Tecnologia                                        |
| ------------------- | ------------------------------------------------- |
| Frontend            | Angular 18 (standalone components, signals)       |
| Backend             | NestJS (REST API)                                 |
| Linguagem           | TypeScript em `strict` mode (mono-repo)           |
| Banco               | PostgreSQL (Supabase em dev e prod)               |
| ORM                 | Prisma (no backend NestJS)                        |
| UI                  | ng-zorro-antd — sem Tailwind, sem outros frameworks de UI |
| Auth                | Passport.js + JWT (NestJS Guards + Angular Guards)|
| Validação           | Zod nos boundaries dos endpoints NestJS           |
| Testes              | Jest (unit/integration) + Playwright (e2e crítico)|
| Package manager     | npm                                               |
| Dev local           | Docker Desktop (PostgreSQL + app)                 |
| Recibos PDF         | `pdfmake` ou `pdf-lib`                            |
| Virtualização (UI)  | `@angular/cdk/scrolling` (virtual scroll)         |

**Decisão consciente:** Angular 18 SPA + NestJS API separados. Comunicação
via REST (HttpClient Angular → controllers NestJS). Prisma e toda a lógica de
domínio ficam exclusivamente no backend. Frontend nunca acessa o banco diretamente.

---

## 3. Domínio

### 3.1 Glossário

| Termo           | Definição                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------- |
| **Campanha**    | Sorteio com prêmio definido (ex: "Sorteio do Carro 2026"). Tem data, prêmio, configuração de carnês. |
| **Carnê**       | Uma "entrada" numa campanha, vinculada a um participante. Tem `numero_sorte` único na campanha. |
| **Parcela**     | Fração do valor do carnê. Quantidade fixa por campanha (`num_parcelas`).                        |
| **Pagamento**   | Registro de quitação de uma parcela, em dinheiro ou Pix.                                        |
| **Participante**| Pessoa que comprou um ou mais carnês.                                                           |
| **Quitado**     | Carnê com **todas** as parcelas pagas. Critério único de aptidão ao sorteio.                    |
| **max_carnes**  | Teto de carnês disponíveis numa campanha. Aceita qualquer inteiro positivo.                     |

### 3.2 Modelo de Dados (entidades)

```
CAMPANHA       (1) ── (N) CARNE
PARTICIPANTE   (1) ── (N) CARNE
CARNE          (1) ── (N) PARCELA
PARCELA        (1) ── (N) PAGAMENTO
USUARIO        (1) ── (N) PAGAMENTO   (quem registrou)
```

**Campos principais por entidade:**

- **Campanha**: `id`, `nome`, `premio`, `data_sorteio`, `valor_carne` (Decimal),
  `num_parcelas` (Int), `max_carnes` (Int), `status` (enum).
- **Participante**: `id`, `nome`, `cpf`, `telefone`, `endereco`.
- **Carne**: `id`, `campanha_id`, `participante_id`, `numero_sorte`, `status`,
  `criado_em`.
- **Parcela**: `id`, `carne_id`, `numero` (1..N), `status` (`pendente` | `paga`).
  **Sem `vencimento` e sem `valor` — ambos derivados.**
- **Pagamento**: `id`, `parcela_id`, `usuario_id`, `valor_pago`,
  `data_pagamento` (Date, editável), `criado_em` (Timestamp, auditoria),
  `metodo` (`dinheiro` | `pix`), `referencia`.
- **Usuario**: `id`, `nome`, `email`, `senha_hash`, `role`.

A versão canônica é `prisma/schema.prisma`.

### 3.3 Regras de Negócio Imutáveis

Estas regras são contratos com o domínio. Mudá-las exige discussão explícita
com o dono do produto, não é decisão técnica.

1. **Quitação é binária e por carnê.** Um carnê é apto ao sorteio se, e somente
   se, todas as suas parcelas têm `status = 'paga'`. Não existe aptidão
   proporcional ou "quase quitado".

2. **`numero_sorte` é único por campanha**, não global. Mesma campanha não pode
   ter dois carnês com o mesmo número. Campanhas diferentes podem reusar
   números livremente. Garantido por `UNIQUE(campanha_id, numero_sorte)` no
   banco.

3. **`valor_carne` e `num_parcelas` são imutáveis após a primeira venda.**
   Editar isso quebraria a consistência entre carnês da mesma campanha
   (alguns com 12 parcelas, outros com 10). UI bloqueia, backend valida.

4. **Carnês e parcelas NÃO são pré-criados na criação da campanha.** Geração
   lazy: na hora da venda, uma transação cria 1 Carnê + N Parcelas atomicamente.
   Cadastrar a campanha só persiste configuração.

5. **Compra em lote.** Um participante pode comprar 1 ou mais carnês na mesma
   operação. Tudo numa transação `BEGIN/COMMIT` — ou cria todos os solicitados,
   ou nenhum. Nunca parcial.

6. **Sem limite de carnês por participante.** O único teto é `max_carnes` da
   campanha.

7. **`max_carnes` aceita qualquer inteiro positivo.** Pode ser 50 ou 5000. UI
   deve escalar (virtualização da cartela quando > 200).

8. **Parcelas não têm vencimento individual.** O único deadline é
   *"carnê quitado até 1 dia antes da `data_sorteio`"*. Não existe estado de
   "parcela atrasada" — só `pendente` ou `paga`.

9. **Valores são sempre redondos.** `valor_carne / num_parcelas` deve resultar
   em valor exato. Validação no formulário avisa (não bloqueia) se a divisão
   for quebrada.

10. **Propriedades calculadas nunca são armazenadas.** `is_quitado`,
    `valor_parcela`, status agregados — sempre derivados via query ou função
    pura. Source of truth é a soma das parcelas/pagamentos, não um campo
    redundante.

11. **`data_pagamento` ≠ `criado_em`.** A primeira é editável (data real do
    recebimento, pode ser retroativo). A segunda é audit (timestamp gerado pelo
    banco no INSERT). UI alerta se `data_pagamento` for retroativa em mais de
    30 dias.

12. **Métodos de pagamento aceitos:** `dinheiro` e `pix`. Apenas. Cartão,
    boleto e crédito automático estão fora do escopo.

### 3.4 Decisões Confirmadas

| Decisão             | Definição final                                      |
| ------------------- | ---------------------------------------------------- |
| Integração Pix      | **Manual** — tesoureiro confirma na UI               |
| Multi-tenant        | **Não** — single-tenant, uma única igreja            |
| Sorteio             | **Fora do sistema** — externo, não registrado no app |
| Notificações        | **Não haverá** — nenhum tipo de notificação automática |

---

## 4. Estrutura do Repositório

Mono-repo com dois projetos separados:

```
.
├── backend/                          # NestJS API
│   ├── src/
│   │   ├── campanha/                 # module, controller, service
│   │   ├── carne/
│   │   ├── pagamento/
│   │   ├── participante/
│   │   ├── relatorio/
│   │   ├── auth/                     # Passport JWT strategy, guards
│   │   ├── domain/                   # funções puras de regra de negócio
│   │   │   ├── quitacao.ts
│   │   │   ├── valor-parcela.ts
│   │   │   └── numeros-livres.ts
│   │   ├── prisma/                   # PrismaService (singleton)
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── test/                         # jest unit + integration
├── frontend/                         # Angular 18 SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── campanhas/            # feature module
│   │   │   ├── carnes/
│   │   │   ├── pagamentos/
│   │   │   ├── participantes/
│   │   │   ├── relatorios/
│   │   │   ├── auth/                 # login, guards, interceptors
│   │   │   └── shared/              # componentes reutilizáveis
│   │   └── environments/
│   └── e2e/                          # playwright
├── docker-compose.yml                # PostgreSQL + backend + frontend
└── CLAUDE.md
```

---

## 5. Convenções de Código

### 5.1 Estrutura de Módulo NestJS

Cada entidade de domínio tem seu próprio módulo: controller (HTTP), service
(lógica), e schemas Zod para validação de entrada. Exemplo:

```typescript
// backend/src/carne/carne.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CarneService } from './carne.service'
import { VenderCarnesDto, VenderCarnesSchema } from './carne.dto'
import { ZodValidationPipe } from '../shared/zod-validation.pipe'

@Controller('carnes')
@UseGuards(JwtAuthGuard)
export class CarneController {
  constructor(private readonly carneService: CarneService) {}

  @Post('vender')
  vender(@Body(new ZodValidationPipe(VenderCarnesSchema)) dto: VenderCarnesDto) {
    return this.carneService.venderCarnes(dto)
  }
}

// backend/src/carne/carne.dto.ts
import { z } from 'zod'

export const VenderCarnesSchema = z.object({
  campanhaId: z.string().uuid(),
  participanteId: z.string().uuid(),
  numerosSorte: z.array(z.number().int().positive()).min(1),
})

export type VenderCarnesDto = z.infer<typeof VenderCarnesSchema>
```

### 5.2 Transações

**Toda operação que cria/atualiza múltiplas linhas relacionadas roda dentro de
`prisma.$transaction()`.** Sem exceção. Exemplos típicos:

- Vender N carnês → cria N carnês + N×P parcelas em uma transação
- Registrar pagamento → cria Pagamento + atualiza `Parcela.status` em uma transação

### 5.3 Validação em Camadas

1. **Boundary:** Zod no `ZodValidationPipe` do NestJS, na entrada do controller. Falha cedo, mensagem clara.
2. **Domínio:** funções puras em `backend/src/domain/`. Recebem dados já validados.
3. **Banco:** constraints (`UNIQUE`, `CHECK`, FKs) como última linha de defesa
   contra race conditions.

### 5.4 Auth (JWT)

- NestJS: `PassportStrategy(Strategy, 'jwt')` valida o token em cada request
- Angular: `HttpInterceptor` injeta o `Authorization: Bearer <token>` em todas
  as chamadas; `AuthGuard` bloqueia rotas não autenticadas no frontend
- Token armazenado em `localStorage` (MVP) — nunca em cookie sem httpOnly

### 5.5 Money Handling

- **Sempre** `Decimal` (`@db.Decimal(10, 2)` no Prisma).
- **Nunca** `number` ou `float` — risco de erro de ponto flutuante em valores
  monetários.
- Conversão explícita em todas as bordas (`new Decimal()`, `.toFixed(2)` só pra
  display).

### 5.6 Naming

| Contexto                | Convenção                              | Exemplo                          |
| ----------------------- | -------------------------------------- | -------------------------------- |
| Modelos Prisma          | PascalCase singular                    | `Carne`, `Parcela`               |
| Tabelas no banco        | snake_case singular                    | `carne`, `parcela`               |
| Campos no banco         | snake_case                             | `valor_carne`, `data_pagamento`  |
| Campos no client TS     | camelCase (via `@map`)                 | `valorCarne`, `dataPagamento`    |
| Funções de domínio      | verbo + substantivo, em pt-br          | `calcularValorParcela`, `listarNumerosLivres` |
| Server Actions          | verbo + substantivo, em pt-br          | `venderCarnes`, `registrarPagamento` |
| Componentes React       | PascalCase, em pt-br                   | `CarneCartela`, `PagamentoForm`  |

Idioma: domínio em **português** (carnê, parcela, sorteio são termos do
negócio, não traduzíveis sem perda). Frameworks/libs em **inglês**.

### 5.7 Computed Properties

Helpers em `lib/domain/`:

```typescript
// lib/domain/quitacao.ts
import type { Carne, Parcela } from '@prisma/client'

export function isQuitado(carne: Carne & { parcelas: Parcela[] }): boolean {
  return carne.parcelas.every((p) => p.status === 'paga')
}

// lib/domain/valor-parcela.ts
import { Decimal } from '@prisma/client/runtime/library'

export function calcularValorParcela(
  valorCarne: Decimal,
  numParcelas: number,
): Decimal {
  return valorCarne.div(numParcelas)
}

// lib/domain/numeros-livres.ts
export async function listarNumerosLivres(campanhaId: string): Promise<number[]> {
  return prisma.$queryRaw<{ num: number }[]>`
    SELECT generate_series(1, (SELECT max_carnes FROM campanha WHERE id = ${campanhaId})) AS num
    EXCEPT
    SELECT numero_sorte FROM carne WHERE campanha_id = ${campanhaId}
    ORDER BY num
  `.then((rows) => rows.map((r) => r.num))
}
```

---

## 6. O Que NÃO Fazer

- **Não** armazenar `is_quitado`, `valor_parcela`, ou qualquer valor calculável
  derivado.
- **Não** criar carnês em massa na criação da campanha (geração lazy).
- **Não** permitir edição de `valor_carne` ou `num_parcelas` após a primeira
  venda.
- **Não** usar `default(now())` no Prisma para `data_pagamento` — esse campo é
  editável pelo usuário, com hoje só como sugestão na UI. Use `default(now())`
  apenas em `criado_em`.
- **Não** escrever queries cross-table sem `campanha_id` no `WHERE` (isolamento
  entre campanhas).
- **Não** sugerir Stripe, PayPal ou outros gateways internacionais — é Pix
  Brasil-only no MVP.
- **Não** usar `float`/`number` para dinheiro. Sempre `Decimal`.
- **Não** rodar mutações fora de `prisma.$transaction()` quando múltiplas
  linhas são afetadas.
- **Não** confiar só em validação client-side — todo endpoint NestJS revalida com Zod.
- **Não** acessar o Prisma ou o banco diretamente do Angular — toda lógica de dados fica no backend NestJS.
- **Não** expor a `DATABASE_URL` ou credenciais do Supabase para o frontend.

---

## 7. Comandos

```bash
# Dev local (Docker Desktop)
docker compose up -d           # sobe PostgreSQL + backend + frontend

# Backend (NestJS)
cd backend
npm install
npm run db:generate            # prisma generate
npm run db:migrate:dev         # prisma migrate dev (desenvolvimento)
npm run db:migrate:deploy      # prisma migrate deploy (CI/produção)
npm run db:seed                # popula banco com 1 campanha exemplo + admin
npm run dev                    # nest start --watch (porta 3000)
npm run build
npm test                       # jest, testes unitários
npm run lint
npm run typecheck

# Frontend (Angular)
cd frontend
npm install
npm run dev                    # ng serve (porta 4200)
npm run build                  # ng build --configuration production
npm run test:e2e               # playwright, fluxos críticos
npm run lint
```

---

## 8. Padrões de UI Importantes (Angular)

### 8.1 Cartela de Números (tela de venda)

Grid mostrando números de 1 a `max_carnes`:
- **Livre:** clicável, fundo claro
- **Vendido:** cinza, desabilitado, mostra nome do dono no hover
- **Selecionado nesta operação:** destacado em cor de ação

Para `max_carnes > 200`, usar `@angular/cdk/scrolling` (`cdk-virtual-scroll-viewport`) para evitar render de milhares de células.

Atalho alternativo: campo de input "digite os números separados por vírgula"
(ex: `47, 88, 122`) e botão "pegar próximos N livres".

### 8.2 Resumo Lateral durante Venda

Painel ancorado mostrando, conforme operador seleciona:
- Quantos carnês estão selecionados
- Total a receber (`selecionados.length × valor_carne`)
- Participante escolhido
- Botão "Confirmar venda"

### 8.3 Tela de Pagamento

Fluxo:
1. Operador busca participante (autocomplete por nome ou CPF)
2. Sistema lista carnês daquele participante na campanha ativa, com indicador
   visual de quitação (`3/7 parcelas pagas`)
3. Operador escolhe um carnê
4. Sistema mostra parcelas em ordem (1, 2, 3...), pendentes em destaque
5. Operador marca uma como paga, preenche:
   - `data_pagamento` (default hoje, editável)
   - `metodo` (radio: dinheiro / pix)
   - `referencia` (opcional, obrigatório se Pix — id da transação)
6. Confirma → Angular chama `POST /pagamentos` → NestJS atualiza Parcela e cria Pagamento em transação

---

## 9. Como Pedir Ajuda à IA neste Repo

Se você é um agente de IA editando este código:

1. **Leia este CLAUDE.md inteiro antes de propor mudanças no schema, regras de
   negócio ou arquitetura.**
2. Se a mudança afeta uma das 12 regras imutáveis (seção 3.3), **pare e
   pergunte** antes de implementar.
3. Se a mudança vai mexer em múltiplas tabelas, **escreva a migration Prisma
   junto** e revise o impacto em queries existentes.
4. Sempre que adicionar uma Server Action nova, adicione um teste em
   `tests/unit/` cobrindo o caso feliz e ao menos um erro de validação.
5. Não deduza preferências do usuário — quando em dúvida sobre escopo, pergunte.

---

*Última revisão: 2026-05-06 — decisões de escopo confirmadas (sem sorteio no sistema, sem multi-tenant, sem notificações, Pix manual).*
