import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean, Matches, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordDonationDto {
  @ApiPropertyOptional({ example: 'Anonymous Donor or Real Name' })
  @IsOptional()
  @IsString()
  donorName?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  donorPhone?: string;

  @ApiPropertyOptional({ example: 'donor@example.com' })
  @IsOptional()
  @IsEmail()
  donorEmail?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ example: 1000, minimum: 10 })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiPropertyOptional({ example: 'uuid-of-campaign' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ example: 'BANK_TRANSFER', description: 'Payment/Donation method (CASH, BANK_TRANSFER, BKASH, NAGAD, ROCKET)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  senderPhone?: string;

  @ApiPropertyOptional({ example: 'TRX-123456789' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'https://i.ibb.co/screenshot.jpg' })
  @IsOptional()
  @IsString()
  paymentProofUrl?: string;

  @ApiPropertyOptional({ example: 'Donation for winter blanket distribution.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewDonationDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'], example: 'APPROVED' })
  @IsString()
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Transaction verified against bKash statement.' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
