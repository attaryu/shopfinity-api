import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { AddressDto } from './address.dto';
import { OrderItemDto } from './order-item.dto';
import { PaymentMethodDto } from './payment-method.dto';
import { ShippingMethodDto } from './shipping-method.dto';

export class CreateOrderDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiPropertyOptional({ example: 'johndoe@example.com' })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ type: [OrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items: OrderItemDto[];

  @ApiProperty({ example: 1200000, description: 'Subtotal in Rupiah' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ type: ShippingMethodDto })
  @ValidateNested()
  @Type(() => ShippingMethodDto)
  shippingMethod: ShippingMethodDto;

  @ApiProperty({ type: PaymentMethodDto })
  @ValidateNested()
  @Type(() => PaymentMethodDto)
  paymentMethod: PaymentMethodDto;
}
