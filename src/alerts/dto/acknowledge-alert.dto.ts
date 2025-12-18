import { IsUUID } from 'class-validator';

export class AcknowledgeAlertDto {
  @IsUUID()
  userId: string;
}
