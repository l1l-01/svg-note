import { Controller, HttpCode, HttpStatus } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { Note } from './interfaces/note.interface';
import { NoteExistsPipe } from './pipes/note-exists.pipe';
import { CreateNoteDto } from './dto/create-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('/all')
  async findAll(): Promise<Note[]> {
    return this.notesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe, NoteExistsPipe) id: number,
  ): Promise<Note> {
    return this.notesService.findOne(id);
  }

  @Post()
  async create(@Body() createNoteDto: CreateNoteDto): Promise<Note> {
    return await this.notesService.create(createNoteDto);
  }

  @Delete('/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(): Promise<void> {
    await this.notesService.deleteAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe, NoteExistsPipe) id: number,
  ): Promise<void> {
    return this.notesService.deleteOne(id);
  }
}
