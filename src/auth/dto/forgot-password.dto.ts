import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email để nhận link reset password',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
