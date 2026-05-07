import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../shared/zod-validation.pipe';
import { PagamentoService } from './pagamento.service';
import { RegistrarPagamentoSchema } from './pagamento.dto';
import type { RegistrarPagamentoDto } from './pagamento.dto';

@Controller('pagamentos')
@UseGuards(JwtAuthGuard)
export class PagamentoController {
  constructor(private service: PagamentoService) {}

  @Get()
  listarPorCarne(@Query('carneId') carneId: string) {
    return this.service.listarPorCarne(carneId);
  }

  @Post()
  registrar(
    @Body(new ZodValidationPipe(RegistrarPagamentoSchema)) dto: RegistrarPagamentoDto,
    @Request() req: any,
  ) {
    return this.service.registrar(dto, req.user.id);
  }
}
