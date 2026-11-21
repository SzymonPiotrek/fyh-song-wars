import { Character } from '../../../shared/types/Character';
import { CombatSystem } from './CombatSystem';

export class CharacterAI {
  private combatSystem: CombatSystem;
  private decisionInterval = 0.5; // Make decisions every 0.5 seconds
  private decisionTimer: Map<string, number> = new Map();

  constructor(combatSystem: CombatSystem) {
    this.combatSystem = combatSystem;
  }

  /**
   * Update AI for a single character
   */
  update(character: Character, allCharacters: Character[], deltaTime: number, arenaWidth: number, arenaHeight: number) {
    if (!character.alive) return;

    // Initialize decision timer
    if (!this.decisionTimer.has(character.id)) {
      this.decisionTimer.set(character.id, 0);
    }

    const timer = this.decisionTimer.get(character.id)!;
    this.decisionTimer.set(character.id, timer + deltaTime);

    // Find nearest alive opponent
    const target = this.findNearestTarget(character, allCharacters);
    if (!target) return;

    const distance = this.combatSystem.distance(character, target);
    const attackRange = this.combatSystem.getAttackRangeForWeapon(character.weapon);

    // Update facing direction
    if (target.position.x > character.position.x) {
      character.facing = 'right';
    } else {
      character.facing = 'left';
    }

    // Decision making
    if (timer >= this.decisionInterval) {
      this.decisionTimer.set(character.id, 0);

      // Use special ability if available and target is close
      if (character.specialAbilityReady && distance < 150) {
        const useAbility = Math.random() < 0.3; // 30% chance to use ability
        if (useAbility) {
          this.combatSystem.useSpecialAbility(character, target);
          return;
        }
      }

      // Attack if in range
      if (distance <= attackRange) {
        this.combatSystem.attack(character, target);
        return;
      }
    }

    // Move toward target
    this.moveToward(character, target, deltaTime);

    // Keep within arena bounds
    this.keepInBounds(character, arenaWidth, arenaHeight);
  }

  /**
   * Find the nearest alive opponent
   */
  private findNearestTarget(character: Character, allCharacters: Character[]): Character | null {
    let nearest: Character | null = null;
    let minDistance = Infinity;

    for (const other of allCharacters) {
      if (other.id === character.id || !other.alive) continue;

      const dist = this.combatSystem.distance(character, other);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = other;
      }
    }

    return nearest;
  }

  /**
   * Move character toward target
   */
  private moveToward(character: Character, target: Character, deltaTime: number) {
    const dx = target.position.x - character.position.x;
    const dy = target.position.y - character.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const speed = character.stats.movementSpeed * deltaTime;
      character.velocity.x = (dx / distance) * speed;
      character.velocity.y = (dy / distance) * speed;

      character.position.x += character.velocity.x;
      character.position.y += character.velocity.y;
    }
  }

  /**
   * Keep character within arena bounds
   */
  private keepInBounds(character: Character, arenaWidth: number, arenaHeight: number) {
    const margin = 20;

    if (character.position.x < margin) {
      character.position.x = margin;
      character.velocity.x = Math.abs(character.velocity.x);
    }
    if (character.position.x > arenaWidth - margin) {
      character.position.x = arenaWidth - margin;
      character.velocity.x = -Math.abs(character.velocity.x);
    }
    if (character.position.y < margin) {
      character.position.y = margin;
      character.velocity.y = Math.abs(character.velocity.y);
    }
    if (character.position.y > arenaHeight - margin) {
      character.position.y = arenaHeight - margin;
      character.velocity.y = -Math.abs(character.velocity.y);
    }
  }
}
