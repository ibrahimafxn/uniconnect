import { IsEmail, IsEnum, IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/roles.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(Role)
  role!: Role;

  /** ID d'un profil étudiant ou enseignant existant à lier au nouveau compte */
  @IsOptional()
  @IsMongoId()
  profileId?: string;
}
