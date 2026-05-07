import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isQuitado } from '../domain/quitacao';

@Injectable()
export class RelatorioService {
  constructor(private prisma: PrismaService) {}

  async resumoCampanha(campanhaId: string) {
    const campanha = await this.prisma.campanha.findUniqueOrThrow({
      where: { id: campanhaId },
      include: {
        carnes: {
          include: { parcelas: true },
        },
      },
    });

    const totalCarnes = campanha.carnes.length;
    const quitados = campanha.carnes.filter((c) => isQuitado(c.parcelas)).length;
    const totalArrecadado = await this.prisma.pagamento.aggregate({
      where: { parcela: { carne: { campanhaId } } },
      _sum: { valorPago: true },
    });

    return {
      campanha: {
        id: campanha.id,
        nome: campanha.nome,
        status: campanha.status,
        dataSorteio: campanha.dataSorteio,
        valorCarne: campanha.valorCarne,
        numParcelas: campanha.numParcelas,
        maxCarnes: campanha.maxCarnes,
      },
      totalCarnes,
      carnesDisponiveis: campanha.maxCarnes - totalCarnes,
      quitados,
      pendentes: totalCarnes - quitados,
      totalArrecadado: totalArrecadado._sum.valorPago ?? 0,
      potencialTotal: campanha.valorCarne.mul(totalCarnes),
    };
  }
}
