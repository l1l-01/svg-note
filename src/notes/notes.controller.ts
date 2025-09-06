import { Controller } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Get, Param, ParseIntPipe } from '@nestjs/common';
import { Note } from './interfaces/note.interface';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('/all')
  async findAll(): Promise<Note[]> {
    return this.notesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Note> {
    return this.notesService.findOne(id);
  }
}
