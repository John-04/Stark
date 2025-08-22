import { IsString, IsNumber, MinLength, Min, IsOptional, IsEnum } from 'class-validator';
import { BountyStatus } from '@prisma/client';
import { CreateBountyDto } from './create-bounty.dto';

export class UpdateBountyDto implements Partial<CreateBountyDto> {
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reward_amount?: number;

  @IsOptional()
  @IsEnum(BountyStatus)
  status?: BountyStatus;
}
