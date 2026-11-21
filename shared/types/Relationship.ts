export interface Relationship {
  character1Id: string;
  character2Id: string;
  score: number;           // -100 to +100
  type: RelationshipType;
}

export enum RelationshipType {
  StrongAlly = 'strongAlly',      // +75 to +100
  Friendly = 'friendly',          // +25 to +74
  Neutral = 'neutral',            // -24 to +24
  Dislike = 'dislike',            // -74 to -25
  StrongRival = 'strongRival'     // -100 to -75
}

export function scoreToType(score: number): RelationshipType {
  if (score >= 75) return RelationshipType.StrongAlly;
  if (score >= 25) return RelationshipType.Friendly;
  if (score >= -24) return RelationshipType.Neutral;
  if (score >= -74) return RelationshipType.Dislike;
  return RelationshipType.StrongRival;
}
