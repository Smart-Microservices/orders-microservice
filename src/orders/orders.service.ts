import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationOrderDto } from './dto/pagination-order.dto';
import { ChangeStatusOrderDto } from './dto/change-status-order.dto';
import { PRODUCT_SERVICE } from 'src/config/services';
import { catchError, firstValueFrom } from 'rxjs';

interface IProduct {
  id: number;
  name: string;
  price: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(PRODUCT_SERVICE) private readonly productClient: ClientProxy,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    // 1. Validar que los productos existan
    const productIds = createOrderDto.items.map((item) => item.productId);
    const products: IProduct[] = await firstValueFrom(
      this.productClient
        .send<IProduct[]>({ cmd: 'validate_products' }, productIds)
        .pipe(
          catchError((error) => {
            throw new RpcException(error as object);
          }),
        ),
    );

    // 2. Calcular los valores
    const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
      const price = products.find(
        (product) => product.id === orderItem.productId,
      );

      return price!.price * orderItem.quantity + acc;
    }, 0);

    const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
      return orderItem.quantity + acc;
    }, 0);

    // 3. Crear la orden
    const order = await this.prisma.order.create({
      data: {
        totalAmount,
        totalItems,
        OrderItem: {
          createMany: {
            data: createOrderDto.items.map((orderItem) => ({
              price: products.find((p) => p.id === orderItem.productId)!.price,
              productId: orderItem.productId,
              quantity: orderItem.quantity,
            })),
          },
        },
      },
      include: {
        OrderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((p) => p.id === orderItem.productId)!.name,
      })),
    };
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        OrderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id #${id} not found`,
      });
    }

    const productIds = order.OrderItem.map((orderItem) => orderItem.productId);
    const products: IProduct[] = await firstValueFrom(
      this.productClient
        .send<IProduct[]>({ cmd: 'validate_products' }, productIds)
        .pipe(
          catchError((error) => {
            throw new RpcException(error as object);
          }),
        ),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((p) => p.id === orderItem.productId)!.name,
      })),
    };
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
