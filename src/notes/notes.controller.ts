import { Controller } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Get } from '@nestjs/common';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async FindOne() {
    return this.notesService.findOne(1);
  }

  @Get('/all')
  async findAll() {
    return this.notesService.findAll();
  }
}
