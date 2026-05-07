import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampanhaModule } from './campanha/campanha.module';
import { CarneModule } from './carne/carne.module';
import { PagamentoModule } from './pagamento/pagamento.module';
import { ParticipanteModule } from './participante/participante.module';
import { RelatorioModule } from './relatorio/relatorio.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CampanhaModule,
    CarneModule,
    PagamentoModule,
    ParticipanteModule,
    RelatorioModule,
  ],
})
export class AppModule {}
