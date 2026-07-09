import { IsString, IsNumber, IsDateString, Length } from 'class-validator';

export class CreateBetDto {
  @IsString()
  @Length(2, 5)
  number!: string;

  @IsNumber()
  amount!: number;

  @IsDateString()
  betDate!: string;
}
