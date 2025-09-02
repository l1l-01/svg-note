import { Injectable } from '@nestjs/common';
import { NoteType } from './interfaces/note.interface';
// using promises in order to not block the event loop
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class NotesService {
  private readonly dbPath = join(__dirname, '..', '..', 'src', 'db');

  async isEmpty(): Promise<boolean> {
    try {
      const files = await fs.readdir(this.dbPath);
      return files.length === 0;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // In case the folder doesn't exist
        return true;
      }
      throw new Error(`Failed to check directory`);
    }
  }

  async findLastId(): Promise<number> {
    const files = await fs.readdir(this.dbPath);
    const lastId = parseInt(files.slice(-1)[0].replace('.svg', ''));
    return lastId;
  }
}
