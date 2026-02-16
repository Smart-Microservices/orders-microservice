import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config/envs';
import { PRODUCT_SERVICE } from '../config/services';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.productMicroservice.host,
          port: envs.productMicroservice.port,
        },
      },
    ]),
  ],
})
export class OrdersModule {}
