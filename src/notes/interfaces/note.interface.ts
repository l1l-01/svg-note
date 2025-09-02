export enum NoteType {
  Personal = 'personal',
  Work = 'work',
  Idea = 'idea',
}

export interface Note {
  id: string;
  title: string;
  content: string;
  noteType: NoteType;
  createdAt: Date;
  UpdatedAt: Date;
}
