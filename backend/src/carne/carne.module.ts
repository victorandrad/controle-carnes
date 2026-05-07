import { Module } from '@nestjs/common';
import { CarneController } from './carne.controller';
import { CarneService } from './carne.service';

@Module({
  controllers: [CarneController],
  providers: [CarneService],
})
export class CarneModule {}
