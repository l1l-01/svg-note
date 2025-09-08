import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from './interfaces/note.interface';
import { rawynoteContent } from './interfaces/raw.interface';
// using promises in order to not block the event loop
import { promises as fs } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { join } from 'path';
import { CreateNoteDto } from './dto/create-note.dto';

type NoteEntry = [string, rawynoteContent, string];

@Injectable()
export class NotesService {
  private readonly dbPath = join(__dirname, '..', '..', 'src', 'db');

  async readRawSVGNote(path: string) {
    const rawSvgNote = await fs.readFile(path, 'utf-8');
    const parser = new XMLParser();
    const noteData = parser.parse(rawSvgNote);
    return noteData;
  }

  async isEmpty(): Promise<string[]> {
    try {
      const files: string[] = await fs.readdir(this.dbPath);
      if (files.length === 0) {
        throw new NotFoundException('Database is empty');
      }
      return files;
    } catch (err) {
      throw new NotFoundException('Database not found');
    }
  }

  async noteExists(id: number): Promise<string> {
    const files = await this.isEmpty();
    const fileName = `${id}.svg`;
    const itemExists: string | undefined = files.find(
      (file) => file === fileName,
    );
    console.log(`file id : ${id}`);
    if (!itemExists) {
      throw new NotFoundException(`Note not found`);
    }
    return fileName;
  }

  async findLastId(): Promise<{ lastId: number; files: string[] }> {
    const files = await this.isEmpty();
    const lastId = parseInt(files.slice(-1)[0].replace('.svg', ''));
    return { lastId, files };
  }

  async findOne(id: number): Promise<Note> {
    const fileName = await this.noteExists(id);
    const allNoteData = await this.readRawSVGNote(`${this.dbPath}/${fileName}`);
    const rawNote: NoteEntry = allNoteData.svg.text;
    if (!rawNote) {
      throw new NotFoundException('Note not found');
    }

    const noteContent: string = rawNote[1]['tspan'].join(' ');
    const noteDate: Date = new Date(rawNote[2].replace('Created:', '').trim());
    const note: Note = {
      id: id,
      title: rawNote[0],
      content: noteContent,
      createdAt: noteDate,
    };

    return note;
  }

  async findAll(): Promise<Note[]> {
    const files = await this.isEmpty();
    let notes: Note[] = [];
    for (const file of files) {
      const noteId: number = parseInt(file.replace('.svg', ''));
      const note: Note = await this.findOne(noteId);
      notes.push(note);
    }
    return notes;
  }
}
