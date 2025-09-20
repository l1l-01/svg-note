import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Note } from './interfaces/note.interface';
import { rawynoteContent } from './interfaces/raw.interface';
// using promises in order to not block the event loop
import { promises as fs } from 'fs';
import { XMLParser } from 'fast-xml-parser';
import { join } from 'path';
import * as path from 'path';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

type NoteEntry = [string, rawynoteContent, string];

@Injectable()
export class NotesService {
  private readonly dbPath = join(__dirname, '..', '..', 'src', 'db');

  writeSvgContent(note: Note): string {
    const words: string[] = note.content.split(' ');
    const [line1, line2, line3, line4] = [
      words.slice(0, 7),
      words.slice(7, 13),
      words.slice(13, 19),
      words.slice(19, 25),
    ].map((arr) => arr.join(' '));

    const svgContent: string = `<svg width="440" height="340" viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Terminal-like gradient background -->
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0d1117"/>
          <stop offset="100%" stop-color="#1c2526"/>
        </linearGradient>

        <!-- Hacker glow effect -->
        <filter id="terminalGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Subtle scanline pattern -->
        <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 4 H4" fill="none" stroke="rgba(0,255,128,0.05)" stroke-width="0.2"/>
        </pattern>
      </defs>

      <!-- Terminal window background -->
      <rect x="20" y="20" width="400" height="300" rx="8" ry="8"
            fill="url(#bgGradient)" stroke="#00ff80" stroke-width="1"
            filter="url(#terminalGlow)"/>
      <rect x="22" y="22" width="396" height="296" fill="url(#scanlines)" opacity="0.4"/>

      <!-- Window controls (terminal dots) -->
      <circle cx="35" cy="35" r="4" fill="#ff5555"/>
      <circle cx="50" cy="35" r="4" fill="#ffaa00"/>
      <circle cx="65" cy="35" r="4" fill="#00ff80"/>

      <!-- Title with terminal prompt style -->
      <text x="40" y="70" font-family="'Fira Code', 'Consolas', monospace" font-size="20" font-weight="500"
            fill="#00ff80" filter="url(#terminalGlow)">${note.title}</text>

      <!-- Divider (command line style) -->
      <line x1="40" y1="80" x2="400" y2="80" stroke="#00ff80" stroke-width="1" opacity="0.8"/>

      <!-- Body text with code-like formatting -->
      <text x="40" y="110" font-family="'Inter', sans-serif" font-size="16" fill="#e6e6e6">
        <tspan x="40" dy="0">${line1 ? line1 : ''}</tspan>
        <tspan x="40" dy="20">${line2 ? line2 : ''}</tspan>
        <tspan x="40" dy="20">${line3 ? line3 : ''}</tspan>
        <tspan x="40" dy="20">${line4 ? line4 : ''}</tspan>
      </text>

      <!-- Footer panel (status bar) -->
      <rect x="40" y="260" width="360" height="40" rx="4" ry="4"
            fill="rgba(0,255,128,0.1)" stroke="#00ff80" stroke-width="0.8"
            filter="url(#terminalGlow)"/>

      <!-- Footer text (timestamp) -->
      <text x="50" y="285" font-family="'Fira Code', 'Consolas', monospace" font-size="12"
            fill="#00ff80">Create At: ${note.createdAt}</text>

      <!-- Hacker accents -->
      <line x1="380" y1="260" x2="400" y2="260" stroke="#00ff80" stroke-width="1.5"/>
      <rect x="390" y="255" width="8" height="8" fill="#00ff80"/>
    </svg>
`;
    return svgContent;
  }

  async createSVG(note: Note): Promise<void> {
    const svgContent: string = this.writeSvgContent(note);
    const filePath: string = path.join(this.dbPath, `${note.id}.svg`);
    try {
      await fs.writeFile(filePath, svgContent, 'utf-8');
    } catch (err) {
      throw new InternalServerErrorException('Failed to create SVG-note');
    }
  }

  async readRawSVGNote(path: string) {
    const rawSvgNote = await fs.readFile(path, 'utf-8');
    const parser = new XMLParser();
    const noteData = parser.parse(rawSvgNote);
    return noteData;
  }

  async isEmpty(): Promise<string[]> {
    try {
      const files: string[] = (await fs.readdir(this.dbPath)) || [];
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
    if (!itemExists) {
      throw new NotFoundException(`Note not found`);
    }
    return fileName;
  }

  async findLastId(): Promise<number> {
    const files = await this.isEmpty();
    let lastId = 0;
    if (files.length > 0) {
      lastId = parseInt(files.slice(-1)[0].replace('.svg', ''));
    }
    return lastId;
  }

  async findOne(id: number): Promise<Note> {
    const fileName = await this.noteExists(id);
    const allNoteData = await this.readRawSVGNote(`${this.dbPath}/${fileName}`);
    const rawNote: NoteEntry = allNoteData.svg.text;
    if (!rawNote) {
      throw new NotFoundException('Note not found');
    }

    const noteContent: string = rawNote[1]['tspan'].join(' ');
    const noteDate: string = rawNote[2].replace('Created:', '').trim();
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

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const lastId: number = await this.findLastId();
    const id = lastId + 1;
    const date = new Date();
    const formatteDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    const note: Note = {
      id: id,
      title: createNoteDto.title,
      content: createNoteDto.content,
      createdAt: formatteDate,
    };
    await this.createSVG(note);
    return note;
  }

  async deleteOne(id: number): Promise<void> {
    const fileName = await this.noteExists(id);
    await fs.unlink(`${this.dbPath}/${fileName}`);
  }

  async deleteAll(): Promise<void> {
    const files = await this.isEmpty();
    if (files.length === 0) {
      throw new NotFoundException('Notes not found');
    }
    for (const file of files) {
      await fs.unlink(`${this.dbPath}/${file}`);
    }
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const fileName: string = await this.noteExists(id);
    const date = new Date();
    const formatteDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    const updatedNote: Note = {
      id: id,
      title: updateNoteDto.title,
      content: updateNoteDto.content,
      createdAt: formatteDate,
    };
    const svgContent: string = this.writeSvgContent(updatedNote);
    const filePath = path.join(this.dbPath, fileName);
    await fs.writeFile(filePath, svgContent);
    return updatedNote;
  }

  async searchByKeyword(keyword: string): Promise<Note[]> {
    const files = await this.isEmpty();
    let notes: Note[] = [];
    for (const file of files) {
      const id: number = parseInt(file.replace('.svg', ''));
      const note: Note = await this.findOne(id);
      const regex = new RegExp(keyword, 'i');
      if (regex.test(note.title) || regex.test(note.content)) {
        notes.push(note);
      }
    }
    return notes;
  }
}
