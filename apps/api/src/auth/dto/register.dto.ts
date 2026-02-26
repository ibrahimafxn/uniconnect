import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/roles.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(Role)
  role!: Role;
}
