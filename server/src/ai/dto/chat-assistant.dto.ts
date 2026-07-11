import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatAssistantDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}
