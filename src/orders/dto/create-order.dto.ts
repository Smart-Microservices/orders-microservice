import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ItemOrderDto } from './item-order.dto';

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => ItemOrderDto)
  items: ItemOrderDto[];
}
