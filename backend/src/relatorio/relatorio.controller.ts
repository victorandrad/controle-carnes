import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RelatorioService } from './relatorio.service';

@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class RelatorioController {
  constructor(private service: RelatorioService) {}

  @Get('campanha/:id')
  resumoCampanha(@Param('id') id: string) {
    return this.service.resumoCampanha(id);
  }
}
