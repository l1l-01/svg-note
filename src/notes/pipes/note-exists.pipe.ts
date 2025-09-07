import { PipeTransform, Injectable, NotFoundException } from '@nestjs/common';
import { NotesService } from '../notes.service';

@Injectable()
export class NoteExistsPipe implements PipeTransform {
  constructor(private readonly notesService: NotesService) {}

  async transform(value: number) {
    const note = await this.notesService.noteExists(value);
    if (!note) {
      throw new NotFoundException(`Note with id ${value} not found`);
    }
    return value;
  }
}
