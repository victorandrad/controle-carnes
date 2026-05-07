import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper: cria carnê + N parcelas numa transação
async function criarCarne(
  campanhaId: string,
  participanteId: string,
  numeroSorte: number,
  numParcelas: number,
) {
  const existente = await prisma.carne.findUnique({
    where: { campanhaId_numeroSorte: { campanhaId, numeroSorte } },
  });
  if (existente) return existente;

  return prisma.$transaction(async (tx) => {
    const carne = await tx.carne.create({
      data: { campanhaId, participanteId, numeroSorte },
    });
    for (let i = 1; i <= numParcelas; i++) {
      await tx.parcela.create({ data: { carneId: carne.id, numero: i } });
    }
    return carne;
  });
}

// Helper: paga N parcelas de um carnê
async function pagarParcelas(
  carneId: string,
  usuarioId: string,
  valorParcela: number,
  qtd: number,
  metodos: ('dinheiro' | 'pix')[],
  dataBase: Date,
) {
  const parcelas = await prisma.parcela.findMany({
    where: { carneId, status: 'pendente' },
    orderBy: { numero: 'asc' },
    take: qtd,
  });

  for (let i = 0; i < parcelas.length; i++) {
    const p = parcelas[i];
    const metodo = metodos[i % metodos.length];
    const data = new Date(dataBase);
    data.setMonth(data.getMonth() + i);

    await prisma.$transaction(async (tx) => {
      await tx.pagamento.create({
        data: {
          parcelaId: p.id,
          usuarioId,
          valorPago: valorParcela,
          dataPagamento: data,
          metodo,
          referencia: metodo === 'pix' ? `E${String(Math.floor(Math.random() * 1e12)).padStart(12, '0')}` : null,
        },
      });
      await tx.parcela.update({ where: { id: p.id }, data: { status: 'paga' } });
    });
  }
}

async function main() {
  const campanha = await prisma.campanha.findFirst({
    where: { nome: 'Sorteio do Carro 2026' },
  });
  if (!campanha) {
    console.error('Campanha não encontrada. Execute npm run db:seed primeiro.');
    return;
  }

  const admin = await prisma.usuario.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    console.error('Usuário admin não encontrado. Execute npm run db:seed primeiro.');
    return;
  }

  const valorParcela = Number(campanha.valorCarne) / campanha.numParcelas; // 10.00
  const NP = campanha.numParcelas;

  // ─── Participantes ───────────────────────────────────────────────────────────
  const participantesData = [
    { nome: 'Maria das Graças Silva',    cpf: '111.222.333-44', telefone: '(11) 98765-4321' },
    { nome: 'João Pedro Oliveira',       cpf: '222.333.444-55', telefone: '(11) 97654-3210' },
    { nome: 'Ana Paula Costa',           cpf: '333.444.555-66', telefone: '(21) 96543-2109' },
    { nome: 'Carlos Eduardo Santos',     cpf: '444.555.666-77', telefone: '(21) 95432-1098' },
    { nome: 'Francisca Aparecida Lima',  cpf: '555.666.777-88', telefone: '(31) 94321-0987' },
    { nome: 'José Antônio Ferreira',     cpf: '666.777.888-99', telefone: '(31) 93210-9876' },
    { nome: 'Luíza Helena Rodrigues',    cpf: '777.888.999-00', telefone: '(41) 92109-8765' },
    { nome: 'Pedro Henrique Alves',      cpf: '888.999.000-11', telefone: '(41) 91098-7654' },
    { nome: 'Sandra Maria Pereira',      cpf: '999.000.111-22', telefone: '(51) 90987-6543' },
    { nome: 'Roberto Carlos Mendes',     cpf: '000.111.222-33', telefone: '(51) 89876-5432' },
    { nome: 'Aparecida de Fátima Souza', cpf: '111.333.555-77', telefone: '(61) 88765-4321' },
    { nome: 'Marcos Antônio Barbosa',    cpf: '222.444.666-88', telefone: '(61) 87654-3210' },
    { nome: 'Rosana Cristina Cardoso',   cpf: '333.555.777-99', telefone: '(71) 86543-2109' },
    { nome: 'Antônio José Nascimento',   cpf: '444.666.888-00', telefone: '(71) 85432-1098' },
    { nome: 'Edilene Batista Araújo',    cpf: '555.777.999-11', telefone: '(81) 84321-0987' },
  ];

  const ps: Record<string, string> = {};
  for (const d of participantesData) {
    const p = await prisma.participante.upsert({
      where: { cpf: d.cpf },
      update: {},
      create: d,
    });
    ps[d.nome] = p.id;
  }
  console.log(`✓ ${participantesData.length} participantes`);

  // ─── Carnês + Pagamentos ─────────────────────────────────────────────────────
  const jan = new Date('2026-01-05');

  // Maria das Graças — 2 carnês: nº1 QUITADO, nº2 com 7 pagas
  const c1 = await criarCarne(campanha.id, ps['Maria das Graças Silva'], 1, NP);
  await pagarParcelas(c1.id, admin.id, valorParcela, NP, ['dinheiro', 'pix'], jan);

  const c2 = await criarCarne(campanha.id, ps['Maria das Graças Silva'], 2, NP);
  await pagarParcelas(c2.id, admin.id, valorParcela, 7, ['dinheiro'], jan);

  // João Pedro — 1 carnê QUITADO
  const c3 = await criarCarne(campanha.id, ps['João Pedro Oliveira'], 3, NP);
  await pagarParcelas(c3.id, admin.id, valorParcela, NP, ['pix'], jan);

  // Ana Paula — 1 carnê, 5 pagas
  const c4 = await criarCarne(campanha.id, ps['Ana Paula Costa'], 4, NP);
  await pagarParcelas(c4.id, admin.id, valorParcela, 5, ['dinheiro'], jan);

  // Carlos Eduardo — 2 carnês: nº5 com 3 pagas, nº6 sem pagamento
  const c5 = await criarCarne(campanha.id, ps['Carlos Eduardo Santos'], 5, NP);
  await pagarParcelas(c5.id, admin.id, valorParcela, 3, ['dinheiro'], jan);
  await criarCarne(campanha.id, ps['Carlos Eduardo Santos'], 6, NP);

  // Francisca — 1 carnê QUITADO
  const c7 = await criarCarne(campanha.id, ps['Francisca Aparecida Lima'], 7, NP);
  await pagarParcelas(c7.id, admin.id, valorParcela, NP, ['dinheiro'], jan);

  // José Antônio — 1 carnê, 9 pagas
  const c8 = await criarCarne(campanha.id, ps['José Antônio Ferreira'], 8, NP);
  await pagarParcelas(c8.id, admin.id, valorParcela, 9, ['pix', 'dinheiro'], jan);

  // Luíza Helena — 1 carnê, 1 paga
  const c9 = await criarCarne(campanha.id, ps['Luíza Helena Rodrigues'], 9, NP);
  await pagarParcelas(c9.id, admin.id, valorParcela, 1, ['dinheiro'], jan);

  // Pedro Henrique — 3 carnês sem pagamento
  await criarCarne(campanha.id, ps['Pedro Henrique Alves'], 10, NP);
  await criarCarne(campanha.id, ps['Pedro Henrique Alves'], 11, NP);
  await criarCarne(campanha.id, ps['Pedro Henrique Alves'], 12, NP);

  // Sandra Maria — 1 carnê, 4 pagas (mix pix/dinheiro)
  const c13 = await criarCarne(campanha.id, ps['Sandra Maria Pereira'], 13, NP);
  await pagarParcelas(c13.id, admin.id, valorParcela, 4, ['pix', 'dinheiro', 'pix', 'pix'], jan);

  // Roberto Carlos — 1 carnê QUITADO
  const c14 = await criarCarne(campanha.id, ps['Roberto Carlos Mendes'], 14, NP);
  await pagarParcelas(c14.id, admin.id, valorParcela, NP, ['dinheiro'], jan);

  // Aparecida — 1 carnê, 2 pagas
  const c15 = await criarCarne(campanha.id, ps['Aparecida de Fátima Souza'], 15, NP);
  await pagarParcelas(c15.id, admin.id, valorParcela, 2, ['dinheiro'], jan);

  // Marcos — 1 carnê, 6 pagas
  const c16 = await criarCarne(campanha.id, ps['Marcos Antônio Barbosa'], 16, NP);
  await pagarParcelas(c16.id, admin.id, valorParcela, 6, ['pix'], jan);

  // Rosana — 1 carnê sem pagamento
  await criarCarne(campanha.id, ps['Rosana Cristina Cardoso'], 17, NP);

  // Antônio — 1 carnê, 11 pagas (quase quitado!)
  const c18 = await criarCarne(campanha.id, ps['Antônio José Nascimento'], 18, NP);
  await pagarParcelas(c18.id, admin.id, valorParcela, 11, ['dinheiro', 'pix'], jan);

  // Edilene — 2 carnês: nº19 com 8 pagas, nº20 com 3 pagas
  const c19 = await criarCarne(campanha.id, ps['Edilene Batista Araújo'], 19, NP);
  await pagarParcelas(c19.id, admin.id, valorParcela, 8, ['dinheiro'], jan);

  const c20 = await criarCarne(campanha.id, ps['Edilene Batista Araújo'], 20, NP);
  await pagarParcelas(c20.id, admin.id, valorParcela, 3, ['pix'], jan);

  console.log('✓ Carnês e pagamentos criados');
  console.log('');
  console.log('Cenários:');
  console.log('  Quitados (aptos ao sorteio): Maria nº1, João nº3, Francisca nº7, Roberto nº14');
  console.log('  Quase quitados: Antônio nº18 (11/12), Maria nº2 (7/12)');
  console.log('  Sem pagamento: Carlos nº6, Pedro nº10-11-12, Rosana nº17');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
