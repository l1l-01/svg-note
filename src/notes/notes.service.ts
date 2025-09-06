import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from './interfaces/note.interface';
import { rawynoteContent } from './interfaces/raw.interface';
// using promises in order to not block the event loop
import { promises as fs } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { join } from 'path';

type NoteEntry = [string, rawynoteContent, string];

@Injectable()
export class NotesService {
  private readonly dbPath = join(__dirname, '..', '..', 'src', 'db');

  async readRawSVGNote(path: string) {
    const rawSvgNote = await fs.readFile(path, 'utf-8');
    const parser = new XMLParser();
    const noteJson = parser.parse(rawSvgNote);
    return noteJson;
  }

  async isEmpty(): Promise<boolean> {
    try {
      const files = await fs.readdir(this.dbPath);
      return files.length === 0;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // In case the folder doesn't exist
        return true;
      }
      throw new NotFoundException('Database not found');
    }
  }

  async findLastId(): Promise<number> {
    const files = await fs.readdir(this.dbPath);
    const lastId = parseInt(files.slice(-1)[0].replace('.svg', ''));
    return lastId;
  }

  async findOne(id: number): Promise<NoteEntry> {
    const empty = await this.isEmpty();
    if (empty) {
      throw new NotFoundException('Database is empty');
    }
    const files: string[] = await fs.readdir(this.dbPath);
    const fileName = `${id}.svg`;
    const itemExists: string | undefined = files.find(
      (file) => file === fileName,
    );
    if (!itemExists) {
      throw new NotFoundException('Note not found');
    }
    const allNoteData = await this.readRawSVGNote(`${this.dbPath}/${fileName}`);
    const note: NoteEntry = allNoteData.svg.text;
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async findAll(): Promise<NoteEntry[]> {
    const empty = await this.isEmpty();
    if (empty) {
      throw new NotFoundException('Database is epmty');
    }
    const files: string[] = await fs.readdir(this.dbPath);
    let notes: NoteEntry[] = [];
    for (const file of files) {
      const noteId: number = parseInt(file.replace('svg', ''));
      const note: NoteEntry = await this.findOne(noteId);
      notes.push(note);
    }
    return notes;
  }
}
