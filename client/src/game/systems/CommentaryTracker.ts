import { Character } from '../../../../shared/types/Character';
import { Relationship, RelationshipType } from '../../../../shared/types/Relationship';
import { CommentaryEvent, CommentarySongInfo } from '../../../../shared/types/Commentary';

const TEAMUP_RANGE = 140;
const TEAMUP_COOLDOWN = 20; // seconds before the same pair+target can trigger again
const ALLY_TYPES = new Set<RelationshipType>([RelationshipType.StrongAlly, RelationshipType.Friendly]);

export function toCommentarySongInfo(character: Character): CommentarySongInfo {
  return {
    title: character.song.title,
    artist: character.song.artist,
    genre: character.song.characteristics.genre,
    mood: character.song.characteristics.mood
  };
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

function distance(a: Character, b: Character): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Watches character state tick-to-tick and surfaces noteworthy moments for the commentator. */
export class CommentaryTracker {
  private relationshipLookup = new Map<string, RelationshipType>();
  private previousKills = new Map<string, number>();
  private knownDead = new Set<string>();
  private teamupCooldowns = new Map<string, number>();

  constructor(relationships: Relationship[]) {
    for (const rel of relationships) {
      this.relationshipLookup.set(pairKey(rel.character1Id, rel.character2Id), rel.type);
    }
  }

  private areAllies(aId: string, bId: string): boolean {
    const type = this.relationshipLookup.get(pairKey(aId, bId));
    return !!type && ALLY_TYPES.has(type);
  }

  update(characters: Character[], deltaTime: number): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];
    const aliveCount = characters.filter(c => c.alive).length;
    const totalCount = characters.length;

    for (const [key, time] of this.teamupCooldowns) {
      const next = time - deltaTime;
      if (next <= 0) this.teamupCooldowns.delete(key);
      else this.teamupCooldowns.set(key, next);
    }

    const newKillers: Character[] = [];
    for (const character of characters) {
      const prevKills = this.previousKills.get(character.id) ?? 0;
      if (character.kills > prevKills) newKillers.push(character);
      this.previousKills.set(character.id, character.kills);
    }

    const newVictims: Character[] = [];
    for (const character of characters) {
      if (!character.alive && !this.knownDead.has(character.id)) {
        this.knownDead.add(character.id);
        newVictims.push(character);
      }
    }

    const usedKillers = new Set<string>();
    for (const victim of newVictims) {
      let best: Character | null = null;
      let bestDist = Infinity;
      for (const killer of newKillers) {
        if (usedKillers.has(killer.id)) continue;
        const dist = distance(killer, victim);
        if (dist < bestDist) {
          bestDist = dist;
          best = killer;
        }
      }
      if (best) {
        usedKillers.add(best.id);
        events.push({
          type: 'kill',
          killer: toCommentarySongInfo(best),
          victim: toCommentarySongInfo(victim),
          kills: best.kills,
          aliveCount,
          totalCount
        });
      }
    }

    const alive = characters.filter(c => c.alive);
    for (const target of alive) {
      const nearby = alive.filter(c => c.id !== target.id && distance(c, target) <= TEAMUP_RANGE);
      for (let i = 0; i < nearby.length; i++) {
        for (let j = i + 1; j < nearby.length; j++) {
          const a = nearby[i];
          const b = nearby[j];
          if (!this.areAllies(a.id, b.id)) continue;

          const key = `${pairKey(a.id, b.id)}::${target.id}`;
          if (this.teamupCooldowns.has(key)) continue;

          this.teamupCooldowns.set(key, TEAMUP_COOLDOWN);
          events.push({
            type: 'teamup',
            teammates: [toCommentarySongInfo(a), toCommentarySongInfo(b)],
            target: toCommentarySongInfo(target)
          });
        }
      }
    }

    return events;
  }
}
