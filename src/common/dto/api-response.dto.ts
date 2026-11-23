import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data?: T;

  @ApiProperty({ required: false })
  meta?: Record<string, any>;

  @ApiProperty({ required: false })
  message?: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean = false;

  @ApiProperty({
    example: {
      code: 'VALIDATION_FAILED',
      message: 'Validation error message',
      details: [{ field: 'phone', message: 'Invalid phone number' }],
      requestId: 'req_01J...',
    },
  })
  error: {
    code: string;
    message: string;
    details?: any[];
    requestId?: string;
  };
}
