import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2, {
    message: 'Note title cannot be less than 2 characters',
  })
  @MaxLength(50, {
    message: 'Note title cannot be longer than 50 characters',
  })
  title: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2, {
    message: 'Note content cannot be less than 2 characters',
  })
  @MaxLength(200, {
    message: 'Note content cannot be longer than 200 characters',
  })
  content: string;
}
