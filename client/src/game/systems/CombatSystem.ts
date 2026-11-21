import { Character } from '../../../../shared/types/Character';

export class CombatSystem {
  private attackRange = 60;
  private meleeAttackRange = 50;

  /**
   * Calculate distance between two characters
   */
  distance(char1: Character, char2: Character): number {
    const dx = char1.position.x - char2.position.x;
    const dy = char1.position.y - char2.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a character can attack another (within range)
   */
  canAttack(attacker: Character, target: Character): boolean {
    if (!attacker.alive || !target.alive) return false;
    const dist = this.distance(attacker, target);
    return dist <= this.attackRange;
  }

  /**
   * Execute an attack from one character to another
   */
  attack(attacker: Character, target: Character): number {
    const baseDamage = attacker.stats.attackDamage;
    const defenseReduction = 1 - target.stats.defense;
    const variance = 0.8 + Math.random() * 0.4; // ±20% variance
    const damage = Math.round(baseDamage * defenseReduction * variance);

    target.stats.health = Math.max(0, target.stats.health - damage);
    attacker.attackAnimation = true;
    attacker.attackTimer = 0.2; // 200ms animation

    if (target.stats.health <= 0) {
      target.alive = false;
      attacker.kills++;
    }

    return damage;
  }

  /**
   * Update attack animations and timers
   */
  updateTimers(character: Character, deltaTime: number) {
    // Attack animation timer
    if (character.attackTimer > 0) {
      character.attackTimer -= deltaTime;
      if (character.attackTimer <= 0) {
        character.attackAnimation = false;
        character.attackTimer = 0;
      }
    }

    // Special ability cooldown
    if (!character.specialAbilityReady) {
      character.specialAbilityTimer -= deltaTime;
      if (character.specialAbilityTimer <= 0) {
        character.specialAbilityReady = true;
        character.specialAbilityTimer = 0;
      }
    }
  }

  /**
   * Use special ability
   */
  useSpecialAbility(character: Character, target: Character): boolean {
    if (!character.specialAbilityReady || !character.alive || !target.alive) return false;

    const dist = this.distance(character, target);
    if (dist > 150) return false; // Special ability range

    // Apply special ability effect
    switch (character.ability) {
      case 'stun':
        // Stun target briefly (handled in AI)
        target.stats.health = Math.max(0, target.stats.health - Math.round(character.stats.attackDamage * 1.5));
        if (target.stats.health <= 0) {
          target.alive = false;
          character.kills++;
        }
        break;
      case 'fireball':
      case 'iceBlast':
      case 'lightning':
        const magicDamage = Math.round(character.stats.attackDamage * 2);
        target.stats.health = Math.max(0, target.stats.health - magicDamage);
        if (target.stats.health <= 0) {
          target.alive = false;
          character.kills++;
        }
        break;
      case 'heal':
        character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 30);
        break;
      case 'dash':
        // Dash toward target
        const dx = target.position.x - character.position.x;
        const dy = target.position.y - character.position.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
          character.position.x += (dx / length) * 100;
          character.position.y += (dy / length) * 100;
        }
        break;
      case 'shield':
        character.stats.defense = Math.min(0.8, character.stats.defense + 0.3);
        setTimeout(() => {
          character.stats.defense = Math.max(0, character.stats.defense - 0.3);
        }, 5000);
        break;
      case 'teleport':
        // Teleport near target
        const angle = Math.random() * Math.PI * 2;
        character.position.x = target.position.x + Math.cos(angle) * 80;
        character.position.y = target.position.y + Math.sin(angle) * 80;
        break;
    }

    character.specialAbilityReady = false;
    character.specialAbilityTimer = character.stats.specialAbilityCooldown;

    return true;
  }

  /**
   * Get the attack range for a weapon type
   */
  getAttackRangeForWeapon(weapon: string): number {
    switch (weapon) {
      case 'bow':
        return 120;
      case 'spear':
        return 70;
      case 'whip':
        return 80;
      default:
        return this.meleeAttackRange;
    }
  }
}
