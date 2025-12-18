import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignBranchDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;
}
