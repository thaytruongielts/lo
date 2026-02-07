
export enum QuestionType {
  TRUE_FALSE_NOT_GIVEN = "True/False/Not Given",
  GAP_FILLING = "Gap Filling",
  MATCHING_INFORMATION = "Matching Information",
  HEADING_MATCHING = "Heading Matching",
  MULTIPLE_CHOICE = "Multiple Choice"
}

export interface ReadingPassage {
  title: string;
  paragraphs: string[];
}

export interface IELTSQuestion {
  type: QuestionType;
  questionText: string;
  correctParagraphIndices: number[];
  explanation: string;
  answer: string;
}

export interface GameData {
  passage: ReadingPassage;
  question: IELTSQuestion;
}

export type GameStatus = 'loading' | 'playing' | 'submitted' | 'error';
