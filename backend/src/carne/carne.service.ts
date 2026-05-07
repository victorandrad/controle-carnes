import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VenderCarnesDto } from './carne.dto';
import { isQuitado } from '../domain/quitacao';

@Injectable()
export class CarneService {
  constructor(private prisma: PrismaService) {}

  async listarPorCampanha(campanhaId: string) {
    const carnes = await this.prisma.carne.findMany({
      where: { campanhaId },
      include: { participante: true, parcelas: true },
      orderBy: { numeroSorte: 'asc' },
    });
    return carnes.map((c) => ({ ...c, quitado: isQuitado(c.parcelas) }));
  }

  async listarPorParticipante(campanhaId: string, participanteId: string) {
    const carnes = await this.prisma.carne.findMany({
      where: { campanhaId, participanteId },
      include: { parcelas: { include: { pagamentos: true }, orderBy: [{ status: 'asc' }, { numero: 'asc' }] } },
      orderBy: { numeroSorte: 'asc' },
    });
    return carnes.map((c) => ({ ...c, quitado: isQuitado(c.parcelas) }));
  }

  async numerosLivres(campanhaId: string) {
    const campanha = await this.prisma.campanha.findUnique({ where: { id: campanhaId } });
    if (!campanha) throw new NotFoundException('Campanha não encontrada');

    const vendidos = await this.prisma.carne.findMany({
      where: { campanhaId },
      select: { numeroSorte: true },
    });
    const vendidosSet = new Set(vendidos.map((c) => c.numeroSorte));

    const livres: number[] = [];
    for (let i = 1; i <= campanha.maxCarnes; i++) {
      if (!vendidosSet.has(i)) livres.push(i);
    }
    return livres;
  }

  async vender(dto: VenderCarnesDto) {
    const campanha = await this.prisma.campanha.findUnique({ where: { id: dto.campanhaId } });
    if (!campanha) throw new NotFoundException('Campanha não encontrada');
    if (campanha.status !== 'ativa') throw new BadRequestException('Campanha não está ativa');

    const conflito = await this.prisma.carne.findFirst({
      where: { campanhaId: dto.campanhaId, numeroSorte: { in: dto.numerosSorte } },
    });
    if (conflito) throw new ConflictException(`Número ${conflito.numeroSorte} já está vendido`);

    const invalidos = dto.numerosSorte.filter((n) => n < 1 || n > campanha.maxCarnes);
    if (invalidos.length > 0) {
      throw new BadRequestException(`Números fora do intervalo permitido: ${invalidos.join(', ')}`);
    }

    return this.prisma.$transaction(
      dto.numerosSorte.map((numero) =>
        this.prisma.carne.create({
          data: {
            campanhaId: dto.campanhaId,
            participanteId: dto.participanteId,
            numeroSorte: numero,
            parcelas: {
              create: Array.from({ length: campanha.numParcelas }, (_, i) => ({
                numero: i + 1,
                status: 'pendente' as const,
              })),
            },
          },
          include: { parcelas: true },
        }),
      ),
    );
  }
}
