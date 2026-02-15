import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatus } from 'generated/prisma/enums';

export class ChangeStatusOrderDto {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatus, {
    message: `Order status must be one of ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus;
}
