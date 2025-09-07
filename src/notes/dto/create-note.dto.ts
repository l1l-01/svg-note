import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  content: string;
}
