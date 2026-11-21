export type CommentaryEventType = 'kill' | 'teamup' | 'winner';

export interface CommentarySongInfo {
  title: string;
  artist: string;
  genre: string;
  mood: string;
}

export interface CommentaryEvent {
  type: CommentaryEventType;
  killer?: CommentarySongInfo;
  victim?: CommentarySongInfo;
  teammates?: [CommentarySongInfo, CommentarySongInfo];
  target?: CommentarySongInfo;
  winner?: CommentarySongInfo;
  aliveCount?: number;
  totalCount?: number;
  kills?: number;
}
