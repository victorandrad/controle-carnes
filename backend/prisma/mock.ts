import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function criarCarne(
  campanhaId: string,
  participanteId: string,
  numeroSorte: number,
  numParcelas: number,
  parcelasPagas: number,
  valorParcela: Decimal,
  adminId: string,
  opcoes: {
    status?: 'ativo' | 'cancelado';
    metodo?: (i: number) => 'dinheiro' | 'pix';
    dataBase?: Date;
  } = {},
) {
  const { status = 'ativo', metodo = () => 'dinheiro', dataBase = new Date() } = opcoes;

  const carne = await prisma.carne.create({
    data: {
      campanhaId,
      participanteId,
      numeroSorte,
      status,
      parcelas: {
        create: Array.from({ length: numParcelas }, (_, i) => ({
          numero: i + 1,
          status: i < parcelasPagas ? 'paga' : 'pendente',
        })),
      },
    },
    include: { parcelas: { orderBy: { numero: 'asc' } } },
  });

  for (let i = 0; i < parcelasPagas; i++) {
    const parcela = carne.parcelas[i];
    const data = new Date(dataBase);
    data.setMonth(data.getMonth() - (parcelasPagas - i));
    const m = metodo(i);
    await prisma.pagamento.create({
      data: {
        parcelaId: parcela.id,
        usuarioId: adminId,
        valorPago: valorParcela,
        dataPagamento: data,
        metodo: m,
        referencia: m === 'pix' ? `PIX-${parcela.id.slice(0, 8).toUpperCase()}` : null,
      },
    });
  }

  return carne;
}

async function main() {
  console.log('Gerando mock...\n');

  // ── Usuários ────────────────────────────────────────────────────
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@igreja.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@igreja.com',
      senhaHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'tesoureiro@igreja.com' },
    update: {},
    create: {
      nome: 'Tesoureiro Silva',
      email: 'tesoureiro@igreja.com',
      senhaHash: await bcrypt.hash('tesoureiro123', 10),
      role: 'tesoureiro',
    },
  });

  // ── Limpar dados mock anteriores ────────────────────────────────
  await prisma.pagamento.deleteMany({});
  await prisma.parcela.deleteMany({});
  await prisma.carne.deleteMany({});
  await prisma.campanha.deleteMany({});
  await prisma.participante.deleteMany({});

  // ── Participantes ───────────────────────────────────────────────
  // Cobre: CPF+telefone+endereço / CPF+telefone / só CPF / só telefone / nenhum
  const [joao, maria, pedro, ana, carlos, fernanda, roberto, juliana] =
    await Promise.all([
      prisma.participante.create({ data: { nome: 'João da Silva',   cpf: '529.982.247-25', telefone: '(11) 99111-0001', endereco: 'Rua das Flores, 123 - São Paulo/SP' } }),
      prisma.participante.create({ data: { nome: 'Maria Oliveira',  cpf: '987.654.321-00', telefone: '(11) 98222-0002' } }),
      prisma.participante.create({ data: { nome: 'Pedro Santos',    cpf: '714.521.863-40' } }),
      prisma.participante.create({ data: { nome: 'Ana Costa',       telefone: '(11) 97444-0004' } }),
      prisma.participante.create({ data: { nome: 'Carlos Ferreira', cpf: '456.789.123-05', telefone: '(11) 96555-0005', endereco: 'Av. Paulista, 1000 - São Paulo/SP' } }),
      prisma.participante.create({ data: { nome: 'Fernanda Lima',   cpf: '321.654.987-20', telefone: '(11) 95666-0006' } }),
      prisma.participante.create({ data: { nome: 'Roberto Alves' } }),
      prisma.participante.create({ data: { nome: 'Juliana Martins', cpf: '159.357.486-08', telefone: '(11) 93888-0008' } }),
    ]);

  console.log('Participantes: 8');

  // ────────────────────────────────────────────────────────────────
  // CAMPANHA 1 — ATIVA com carnês
  // R$120 / 12x = R$10/parcela
  // ────────────────────────────────────────────────────────────────
  const campAtiva = await prisma.campanha.create({
    data: {
      nome: 'Sorteio do Carro 2026',
      premio: 'Volkswagen Polo 0km',
      dataSorteio: new Date('2026-12-31'),
      valorCarne: new Decimal('120.00'),
      numParcelas: 12,
      maxCarnes: 300,
      status: 'ativa',
    },
  });

  const vp1 = new Decimal('10.00');

  await criarCarne(campAtiva.id, joao.id,     1, 12, 12, vp1, admin.id, { metodo: () => 'dinheiro' });
  await criarCarne(campAtiva.id, maria.id,    2, 12, 6,  vp1, admin.id);
  await criarCarne(campAtiva.id, pedro.id,    3, 12, 3,  vp1, admin.id, { metodo: i => i % 2 === 0 ? 'dinheiro' : 'pix' });
  await criarCarne(campAtiva.id, ana.id,      4, 12, 0,  vp1, admin.id);
  await criarCarne(campAtiva.id, carlos.id,   5, 12, 12, vp1, admin.id, { metodo: () => 'pix' });
  await criarCarne(campAtiva.id, carlos.id,   6, 12, 8,  vp1, admin.id, { metodo: i => i % 3 !== 1 ? 'dinheiro' : 'pix' });
  await criarCarne(campAtiva.id, fernanda.id, 7, 12, 0,  vp1, admin.id);
  await criarCarne(campAtiva.id, roberto.id,  8, 12, 0,  vp1, admin.id, { status: 'cancelado' });
  await criarCarne(campAtiva.id, juliana.id,  9, 12, 1,  vp1, admin.id);

  console.log('Campanha ativa "Sorteio do Carro 2026": 9 carnês');
  console.log('  nº1  João       quitado (12/12 dinheiro)');
  console.log('  nº2  Maria      parcial (6/12 dinheiro)');
  console.log('  nº3  Pedro      parcial (3/12 dinheiro+pix)');
  console.log('  nº4  Ana        sem pagamento');
  console.log('  nº5  Carlos     quitado (12/12 pix)');
  console.log('  nº6  Carlos     parcial (8/12 mix) — 2º carnê');
  console.log('  nº7  Fernanda   sem pagamento');
  console.log('  nº8  Roberto    cancelado');
  console.log('  nº9  Juliana    1 parcela paga');

  // ────────────────────────────────────────────────────────────────
  // CAMPANHA 2 — ENCERRADA com histórico
  // R$60 / 6x = R$10/parcela
  // ────────────────────────────────────────────────────────────────
  const campEncerrada = await prisma.campanha.create({
    data: {
      nome: 'Sorteio da Moto 2025',
      premio: 'Honda CG 160 Titan 0km',
      dataSorteio: new Date('2025-06-15'),
      valorCarne: new Decimal('60.00'),
      numParcelas: 6,
      maxCarnes: 100,
      status: 'encerrada',
    },
  });

  const vp2 = new Decimal('10.00');
  const base2025 = new Date('2025-06-01');

  await criarCarne(campEncerrada.id, joao.id,     1, 6, 6, vp2, admin.id, { dataBase: base2025, metodo: () => 'dinheiro' });
  await criarCarne(campEncerrada.id, maria.id,    2, 6, 4, vp2, admin.id, { dataBase: base2025 });
  await criarCarne(campEncerrada.id, pedro.id,    3, 6, 6, vp2, admin.id, { dataBase: base2025, metodo: () => 'pix' });
  await criarCarne(campEncerrada.id, fernanda.id, 4, 6, 0, vp2, admin.id, { dataBase: base2025 });

  console.log('\nCampanha encerrada "Sorteio da Moto 2025": 4 carnês');
  console.log('  nº1  João      quitado (6/6)');
  console.log('  nº2  Maria     parcial (4/6)');
  console.log('  nº3  Pedro     quitado (6/6 pix)');
  console.log('  nº4  Fernanda  sem pagamento');

  // ────────────────────────────────────────────────────────────────
  // CAMPANHA 3 — ATIVA recém criada, sem carnês
  // ────────────────────────────────────────────────────────────────
  await prisma.campanha.create({
    data: {
      nome: 'Sorteio de Eletrodomésticos 2026',
      premio: 'Kit Eletrodomésticos Consul',
      dataSorteio: new Date('2026-08-10'),
      valorCarne: new Decimal('50.00'),
      numParcelas: 5,
      maxCarnes: 200,
      status: 'ativa',
    },
  });

  console.log('\nCampanha ativa "Sorteio de Eletrodomésticos 2026": sem carnês');

  console.log('\nMock concluído!');
  console.log('  admin@igreja.com      / admin123');
  console.log('  tesoureiro@igreja.com / tesoureiro123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
