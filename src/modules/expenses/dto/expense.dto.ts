import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseStatus } from '../../../common/constants';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Procurement of 200 Warm Blankets for Roumari' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'BLANKET_PROCUREMENT' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 45000, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2026-11-23' })
  @IsDateString()
  expenseDate: string;

  @ApiProperty({ example: 'M/S Rahman Textiles, Kurigram' })
  @IsString()
  @IsNotEmpty()
  paidTo: string;

  @ApiPropertyOptional({ example: 'https://storage.romonijon.org/invoices/inv_001.pdf' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ example: 'Bulk purchase discount applied.' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ReviewExpenseDto {
  @ApiProperty({ enum: [ExpenseStatus.APPROVED, ExpenseStatus.REJECTED], example: ExpenseStatus.APPROVED })
  @IsEnum(ExpenseStatus)
  decision: ExpenseStatus;

  @ApiPropertyOptional({ example: 'Verified invoice and delivery receipt. Approved.' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
