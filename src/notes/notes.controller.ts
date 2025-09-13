import { Controller, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { NotesService } from './notes.service';
import {
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Render,
} from '@nestjs/common';
import { Note } from './interfaces/note.interface';
import { NoteExistsPipe } from './pipes/note-exists.pipe';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('/search')
  async search(@Query('keyword') keyword: string): Promise<Note[]> {
    return await this.notesService.searchByKeyword(keyword);
  }

  @Get('/all')
  async findAll(): Promise<Note[]> {
    return this.notesService.findAll();
  }

  @Get()
  @Render('notes/index')
  async index(): Promise<{ notes: Note[]; title: string }> {
    const notes: Note[] = await this.notesService.findAll();
    return { notes, title: 'My note' };
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

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe, NoteExistsPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<Note> {
    return await this.notesService.update(id, updateNoteDto);
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
