import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { OrderStatus } from 'generated/prisma/enums';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  public totalAmount: number;

  @IsNumber()
  @IsPositive()
  public totalItems: number;

  @IsEnum(OrderStatus, {
    message: `Order status must be one of ${Object.values(OrderStatus).join(', ')}`,
  })
  @IsOptional()
  public status: OrderStatus = OrderStatus.PENDING;

  @IsBoolean()
  @IsOptional()
  public paid: boolean = false;
}
