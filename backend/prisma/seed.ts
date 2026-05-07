import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash('admin123', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@igreja.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@igreja.com',
      senhaHash,
      role: 'admin',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'tesoureiro@igreja.com' },
    update: {},
    create: {
      nome: 'Tesoureiro',
      email: 'tesoureiro@igreja.com',
      senhaHash: await bcrypt.hash('tesoureiro123', 10),
      role: 'tesoureiro',
    },
  });

  const campanhaExistente = await prisma.campanha.findFirst({
    where: { nome: 'Sorteio do Carro 2026' },
  });
  const campanha =
    campanhaExistente ??
    (await prisma.campanha.create({
      data: {
        nome: 'Sorteio do Carro 2026',
        premio: 'Volkswagen Polo 0km',
        dataSorteio: new Date('2026-12-31'),
        valorCarne: 120.0,
        numParcelas: 12,
        maxCarnes: 300,
      },
    }));

  console.log('Seed concluído:');
  console.log('  Admin: admin@igreja.com / admin123');
  console.log('  Tesoureiro: tesoureiro@igreja.com / tesoureiro123');
  console.log('  Campanha:', campanha.nome);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
