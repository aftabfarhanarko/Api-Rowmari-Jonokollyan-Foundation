import { IsString, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Rahim Uddin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'rahim@example.com or +8801712345678' })
  @IsString()
  @Matches(/^(?:\+?[0-9]{8,15}|[^\s@]+@[^\s@]+\.[^\s@]+)$/)
  contactInfo: string;

  @ApiProperty({ example: 'Please contact me about the assistance application.' })
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  message: string;
}
