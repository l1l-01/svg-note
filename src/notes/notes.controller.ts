import { Controller } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Get } from '@nestjs/common';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async isEmpty() {
    return this.notesService.getNote(1);
  }
}
