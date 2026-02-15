import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';
import { PaginationOrderDto } from './dto/pagination-order.dto';
import { ChangeStatusOrderDto } from './dto/change-status-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}
  create(createOrderDto: CreateOrderDto) {
    return this.prisma.order.create({ data: createOrderDto });
  }

  async findAll(paginationOrderDto: PaginationOrderDto) {
    const { page, limit, status } = paginationOrderDto;
    const totalRecords = await this.prisma.order.count({
      where: { status },
    });
    const lastPage = Math.ceil(totalRecords / limit!);

    const options = {
      take: limit,
      skip: (page! - 1) * limit!,
    };

    if (page! > lastPage) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `La página ${page} excede la última página ${lastPage}`,
      });
    }

    return {
      data: await this.prisma.order.findMany({
        ...options,
        orderBy: { id: 'asc' },
        where: { status },
      }),
      metadata: {
        total: totalRecords,
        pageCurrent: page,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id #${id} not found`,
      });
    }

    return order;
  }

  async changeStatus(changeStatusOrderDto: ChangeStatusOrderDto) {
    const { id, status } = changeStatusOrderDto;
    const order = await this.findOne(id);

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id #${id} not found`,
      });
    }

    if (order.status === status) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Order with id #${id} already has status ${status}`,
      });
    }

    return await this.prisma.order.update({
      where: { id },
      data: {
        status,
      },
    });
  }
}
