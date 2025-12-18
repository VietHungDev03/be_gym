import { IsUUID, IsString, IsOptional } from 'class-validator';

export class ResolveAlertDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
