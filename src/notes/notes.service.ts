import { Injectable, NotFoundException } from '@nestjs/common';
import { Note } from './interfaces/note.interface';
// using promises in order to not block the event loop
import { promises as fs } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { join } from 'path';

@Injectable()
export class NotesService {
  private readonly dbPath = join(__dirname, '..', '..', 'src', 'db');

  async readNote(path: string) {
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
      throw new NotFoundException('directory not found');
    }
  }

  async findLastId(): Promise<number> {
    const files = await fs.readdir(this.dbPath);
    const lastId = parseInt(files.slice(-1)[0].replace('.svg', ''));
    return lastId;
  }

  async getNote(id: number) {
    const empty = await this.isEmpty();
    if (empty) {
      throw new Error('No notes found');
    }
    const files: string[] = await fs.readdir(this.dbPath);
    const fileName = `${id}.svg`;
    const itemExists: string | undefined = files.find(
      (file) => file === fileName,
    );
    if (!itemExists) {
      throw new NotFoundException('Note not found');
    }
    const note = await this.readNote(`${this.dbPath}/${fileName}`);
    if (!itemExists) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }
}
