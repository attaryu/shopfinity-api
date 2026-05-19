import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/request/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/request/update-cart-item.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ControllerResponse } from '../../common/types/controller-response';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiOkResponse({ description: 'Cart retrieved successfully' })
  async getCart(@Req() req: any): Promise<ControllerResponse> {
    const cart = await this.cartService.getCart(req.user.id);
    return {
      message: 'Cart retrieved successfully',
      data: { cart },
    };
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiCreatedResponse({ description: 'Item added to cart' })
  async addItem(@Req() req: any, @Body() dto: AddCartItemDto): Promise<ControllerResponse> {
    const cart = await this.cartService.addItem(req.user.id, dto);
    return {
      message: 'Item added to cart successfully',
      data: { cart },
    };
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiOkResponse({ description: 'Cart item updated' })
  async updateItemQuantity(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<ControllerResponse> {
    const cart = await this.cartService.updateItemQuantity(req.user.id, id, dto);
    return {
      message: 'Cart item updated successfully',
      data: { cart },
    };
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiOkResponse({ description: 'Cart item removed' })
  async removeItem(@Req() req: any, @Param('id') id: string): Promise<ControllerResponse> {
    const cart = await this.cartService.removeItem(req.user.id, id);
    return {
      message: 'Cart item removed successfully',
      data: { cart },
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiOkResponse({ description: 'Cart cleared' })
  async clearCart(@Req() req: any): Promise<ControllerResponse> {
    const cart = await this.cartService.clearCart(req.user.id);
    return {
      message: 'Cart cleared successfully',
      data: { cart },
    };
  }
}
