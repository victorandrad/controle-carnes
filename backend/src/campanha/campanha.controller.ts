import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../shared/zod-validation.pipe';
import { CampanhaService } from './campanha.service';
import { AtualizarCampanhaSchema, CriarCampanhaSchema } from './campanha.dto';
import type { AtualizarCampanhaDto, CriarCampanhaDto } from './campanha.dto';

@Controller('campanhas')
@UseGuards(JwtAuthGuard)
export class CampanhaController {
  constructor(private service: CampanhaService) {}

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscar(id);
  }

  @Post()
  criar(@Body(new ZodValidationPipe(CriarCampanhaSchema)) dto: CriarCampanhaDto) {
    return this.service.criar(dto);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AtualizarCampanhaSchema)) dto: AtualizarCampanhaDto,
  ) {
    return this.service.atualizar(id, dto);
  }

  @Patch(':id/encerrar')
  encerrar(@Param('id') id: string) {
    return this.service.encerrar(id);
  }

  @Delete(':id')
  excluir(@Param('id') id: string) {
    return this.service.excluir(id);
  }
}
