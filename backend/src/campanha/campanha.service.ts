import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarCampanhaDto, AtualizarCampanhaDto } from './campanha.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CampanhaService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    const campanhas = await this.prisma.campanha.findMany({
      orderBy: { criadoEm: 'desc' },
      include: { _count: { select: { carnes: true } } },
    });
    return campanhas.map(({ _count, ...c }) => ({ ...c, carnesVendidos: _count.carnes }));
  }

  async buscar(id: string) {
    const campanha = await this.prisma.campanha.findUnique({ where: { id } });
    if (!campanha) throw new NotFoundException('Campanha não encontrada');
    return campanha;
  }

  criar(dto: CriarCampanhaDto) {
    return this.prisma.campanha.create({
      data: {
        nome: dto.nome,
        premio: dto.premio,
        dataSorteio: new Date(dto.dataSorteio),
        valorCarne: new Decimal(dto.valorCarne),
        numParcelas: dto.numParcelas,
        maxCarnes: dto.maxCarnes,
      },
    });
  }

  async atualizar(id: string, dto: AtualizarCampanhaDto) {
    const campanha = await this.prisma.campanha.findUnique({
      where: { id },
      include: { _count: { select: { carnes: true } } },
    });
    if (!campanha) throw new NotFoundException('Campanha não encontrada');
    if (campanha.status === 'encerrada') throw new BadRequestException('Campanha encerrada não pode ser editada');

    if (dto.maxCarnes !== undefined && dto.maxCarnes < campanha._count.carnes) {
      throw new BadRequestException(
        `Não é possível reduzir o máximo: ${campanha._count.carnes} carnê(s) já foram vendidos`,
      );
    }

    return this.prisma.campanha.update({
      where: { id },
      data: {
        ...(dto.nome        !== undefined && { nome: dto.nome }),
        ...(dto.premio      !== undefined && { premio: dto.premio }),
        ...(dto.dataSorteio !== undefined && { dataSorteio: new Date(dto.dataSorteio) }),
        ...(dto.maxCarnes   !== undefined && { maxCarnes: dto.maxCarnes }),
      },
    });
  }

  async encerrar(id: string) {
    const campanha = await this.buscar(id);
    if (campanha.status === 'encerrada') throw new BadRequestException('Campanha já está encerrada');
    return this.prisma.campanha.update({ where: { id }, data: { status: 'encerrada' } });
  }

  async excluir(id: string) {
    const campanha = await this.prisma.campanha.findUnique({
      where: { id },
      include: { _count: { select: { carnes: true } } },
    });
    if (!campanha) throw new NotFoundException('Campanha não encontrada');
    if (campanha._count.carnes > 0) {
      throw new BadRequestException('Não é possível excluir uma campanha que já possui carnês vendidos');
    }
    return this.prisma.campanha.delete({ where: { id } });
  }
}
