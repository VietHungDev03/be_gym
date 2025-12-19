import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1200)
  message: string;

  @IsOptional()
  @IsString()
  @IsIn(['chat', 'technical'])
  mode?: 'chat' | 'technical';

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
