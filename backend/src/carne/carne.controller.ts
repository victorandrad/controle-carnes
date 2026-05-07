import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../shared/zod-validation.pipe';
import { CarneService } from './carne.service';
import { VenderCarnesSchema } from './carne.dto';
import type { VenderCarnesDto } from './carne.dto';

@Controller('carnes')
@UseGuards(JwtAuthGuard)
export class CarneController {
  constructor(private service: CarneService) {}

  @Get()
  listarPorCampanha(@Query('campanhaId') campanhaId: string) {
    return this.service.listarPorCampanha(campanhaId);
  }

  @Get('numeros-livres')
  numerosLivres(@Query('campanhaId') campanhaId: string) {
    return this.service.numerosLivres(campanhaId);
  }

  @Get('participante')
  listarPorParticipante(
    @Query('campanhaId') campanhaId: string,
    @Query('participanteId') participanteId: string,
  ) {
    return this.service.listarPorParticipante(campanhaId, participanteId);
  }

  @Post('vender')
  vender(@Body(new ZodValidationPipe(VenderCarnesSchema)) dto: VenderCarnesDto) {
    return this.service.vender(dto);
  }
}
