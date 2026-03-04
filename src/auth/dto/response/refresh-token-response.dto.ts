import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Token refreshed successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Response data containing new tokens',
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      user: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'e81705aa-f97e-4483-84bb-0874efac878a',
          },
          email: { type: 'string', example: 'user@shopfinity.com' },
          fullname: { type: 'string', example: 'Test User' },
          role: { type: 'string', example: 'USER' },
        },
      },
    },
  })
  data!: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      fullname: string;
      role: string;
    };
  };

  @ApiProperty({
    description: 'Error details (null if successful)',
    example: null,
    nullable: true,
  })
  error!: null;

  @ApiProperty({
    description: 'Response metadata',
    type: 'object',
    properties: {
      timestamp: {
        type: 'string',
        example: '2024-03-20T10:00:00Z',
      },
    },
  })
  meta!: {
    timestamp: string;
  };
}
