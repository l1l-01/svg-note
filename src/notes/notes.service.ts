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

type NoteEntry = [string, rawynoteContent, string];

@Injectable()
export class NotesService {
  private readonly dbPath = join(__dirname, '..', '..', 'src', 'db');

  async createSVG(note: Note): Promise<void> {
    const words: string[] = note.content.split(' ');
    const [line1, line2, line3, line4] = [
      words.slice(0, 7),
      words.slice(7, 13),
      words.slice(13, 19),
      words.slice(19, 25),
    ].map((arr) => arr.join(' '));

    const svgContent: string = `
      <svg width="440" height="340" viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background gradient -->
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a0a12"/>
          <stop offset="100%" stop-color="#1a0f2e"/>
        </linearGradient>

        <!-- Neon glow filter -->
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ff008c"/>
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00eaff"/>
        </filter>

        <!-- Grid overlay -->
        <pattern id="techGrid" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M14 0 L0 0 0 14" fill="none" stroke="rgba(0,234,255,0.05)" stroke-width="0.5"/>
        </pattern>
      </defs>

      <!-- Layered panel background -->
      <polygon points="30,30 410,20 400,300 20,310"
               fill="url(#bgGradient)" stroke="#00eaff" stroke-width="1.5"
               filter="url(#neonGlow)"/>
      <polygon points="35,35 405,25 395,295 25,305"
               fill="url(#techGrid)" opacity="0.3"/>

      <!-- Futuristic side bars -->
      <rect x="30" y="60" width="6" height="220" fill="#ff008c" opacity="0.6"/>
      <rect x="404" y="60" width="6" height="220" fill="#00eaff" opacity="0.6"/>

      <!-- Corner markers -->
      <circle cx="30" cy="30" r="4" fill="#00ff99"/>
      <circle cx="410" cy="20" r="4" fill="#ff008c"/>
      <circle cx="400" cy="300" r="4" fill="#00eaff"/>
      <circle cx="20" cy="310" r="4" fill="#ff66cc"/>

      <!-- Title -->
      <text x="50" y="70" font-family="Orbitron, monospace" font-size="20" font-weight="bold"
            fill="#00eaff" filter="url(#neonGlow)">${note.title}</text>

      <!-- Divider with glowing pulse -->
      <line x1="50" y1="80" x2="370" y2="80" stroke="#ff008c" stroke-width="1.5" opacity="0.9"/>

      <!-- Body content -->
      <text x="50" y="115" font-family="Share Tech Mono, monospace" font-size="14" fill="#c0faff">
        <tspan x="50" dy="0">>${line1 ? line1 : ''}</tspan>
        <tspan x="50" dy="22">${line2 ? line2 : ''}</tspan>
        <tspan x="50" dy="22">${line3 ? line3 : ''}</tspan>
        <tspan x="50" dy="22">${line4 ? line4 : ''}</tspan>
      </text>

      <!-- Futuristic bottom panel -->
      <rect x="50" y="250" width="320" height="40" rx="4" ry="4"
            fill="rgba(0,234,255,0.08)" stroke="#ff008c" stroke-width="1"
            filter="url(#neonGlow)"/>

      <!-- Footer info -->
      <text x="60" y="275" font-family="Share Tech Mono, monospace" font-size="12"
            fill="#00ff99">Created: ${note.createdAt}</text>

      <!-- Small circuit-like details -->
      <line x1="370" y1="250" x2="400" y2="240" stroke="#00eaff" stroke-width="2"/>
      <circle cx="400" cy="240" r="4" fill="#ff008c"/>
    </svg>`;
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

  async findLastId(): Promise<number> {
    const files = await this.isEmpty();
    const lastId = parseInt(files.slice(-1)[0].replace('.svg', ''));
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
}
