import { Character } from '../../../../shared/types/Character';
import { Arena, ArenaTheme } from '../../../../shared/types/Arena';
import { CombatSystem } from './CombatSystem';
import { CharacterAI } from './CharacterAI';
import { PhysicsSystem } from './PhysicsSystem';
import { EntranceAnimation } from './EntranceAnimation';

export class BattleManager {
  private characters: Character[];
  private combatSystem: CombatSystem;
  private characterAI: CharacterAI;
  private physicsSystem: PhysicsSystem;
  private entranceAnimation: EntranceAnimation;
  private arena: Arena;
  private running = false;
  private winner: Character | null = null;
  private onWinnerAnnounced?: (winner: Character) => void;
  
  // Game phases: 'entrance' | 'fighting'
  private phase: 'entrance' | 'fighting' = 'entrance';

  constructor(initialCharacters: Character[], arena?: Arena) {
    this.characters = initialCharacters;
    this.combatSystem = new CombatSystem();
    this.characterAI = new CharacterAI(this.combatSystem);
    this.physicsSystem = new PhysicsSystem();
    this.entranceAnimation = new EntranceAnimation();

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.arena = arena ? this.rescaleArena(arena, width, height) : this.createDefaultArena(width, height);
    this.physicsSystem.setArena(this.arena);

    // Set up entrance animation
    this.entranceAnimation.setArena(this.arena);
    this.entranceAnimation.setCharacterGetter((id: string) => {
      return this.characters.find(c => c.id === id);
    });
    this.entranceAnimation.prepare(this.characters, this.arena);
    this.entranceAnimation.setOnComplete(() => {
      this.phase = 'fighting';
      console.log('Entrance complete! Battle begins!');
    });
  }

  private rescaleArena(arena: Arena, width: number, height: number): Arena {
    const scaleX = width / arena.width;
    const scaleY = height / arena.height;

    return {
      ...arena,
      width,
      height,
      obstacles: arena.obstacles.map(obstacle => ({
        ...obstacle,
        x: obstacle.x * scaleX,
        y: obstacle.y * scaleY,
        width: obstacle.width * scaleX,
        height: obstacle.height * scaleY
      }))
    };
  }

  private createDefaultArena(width: number, height: number): Arena {
    return {
      id: 'default',
      theme: ArenaTheme.Neon,
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#0f3460',
        ground: '#0a0a1a',
        sky: '#1a1a2e'
      },
      width,
      height,
      obstacles: [],
      backgroundGradient: {
        top: '#1a1a2e',
        bottom: '#0a0a1a'
      },
      decorations: []
    };
  }

  /**
   * Spread characters around the arena for fighting.
   * Called after entrance animation completes.
   */
  private spreadCharactersForFight() {
    const margin = 100;
    const arenaWidth = this.arena.width;
    const arenaHeight = this.arena.height;
    
    this.characters.forEach((character, index) => {
      // Spread characters around the arena
      const cols = Math.ceil(Math.sqrt(this.characters.length));
      const row = Math.floor(index / cols);
      const col = index % cols;

      const spacingX = (arenaWidth - margin * 2) / (cols + 1);
      const spacingY = (arenaHeight - margin * 2) / (Math.ceil(this.characters.length / cols) + 1);

      character.position.x = margin + col * spacingX + spacingX / 2;
      character.position.y = margin + row * spacingY + spacingY / 2;

      // Add slight randomness
      character.position.x += (Math.random() - 0.5) * 50;
      character.position.y += (Math.random() - 0.5) * 50;

      character.velocity.x = 0;
      character.velocity.y = 0;

      this.physicsSystem.addCharacter(character);
    });
  }

  setOnWinnerAnnounced(callback: (winner: Character) => void) {
    this.onWinnerAnnounced = callback;
  }

  start() {
    this.running = true;
    this.phase = 'entrance';
    console.log('Battle started with', this.characters.length, 'characters');
    console.log('Entrance animation beginning...');
  }

  stop() {
    this.running = false;
  }

  update(delta: number) {
    if (!this.running) return;

    const deltaTime = delta / 60; // Normalize to ~60fps

    if (this.phase === 'entrance') {
      // Run entrance animation
      const entranceComplete = this.entranceAnimation.update(delta);
      
      if (entranceComplete) {
        // Transition to fighting phase
        this.phase = 'fighting';
        this.entranceAnimation.cleanup();
        this.spreadCharactersForFight();
        console.log('Entrance complete! Battle begins!');
      }
      return;
    }

    // Fighting phase
    // Update physics
    this.physicsSystem.update();

    // Update each character
    for (const character of this.characters) {
      if (!character.alive) continue;

      // Update AI
      this.characterAI.update(
        character,
        this.characters,
        deltaTime,
        this.arena.width,
        this.arena.height
      );

      // Update combat timers
      this.combatSystem.updateTimers(character, deltaTime);

      // Update physics body position
      this.physicsSystem.updateCharacterPosition(character);
    }

    // Check for winner
    const aliveCharacters = this.characters.filter(c => c.alive);
    if (aliveCharacters.length <= 1 && this.characters.some(c => !c.alive)) {
      this.running = false;
      this.winner = aliveCharacters[0] ?? null;

      if (this.winner && this.onWinnerAnnounced) {
        this.onWinnerAnnounced(this.winner);
      }

      console.log('Battle ended! Winner:', this.winner?.song.title ?? 'None');
    }
  }

  getPhase(): 'entrance' | 'fighting' {
    return this.phase;
  }

  getEntranceAnimation(): EntranceAnimation {
    return this.entranceAnimation;
  }

  getCharacters(): Character[] {
    return this.characters;
  }

  getArena(): Arena {
    return this.arena;
  }

  getWinner(): Character | null {
    return this.winner;
  }

  isRunning(): boolean {
    return this.running;
  }

  getAliveCount(): number {
    return this.characters.filter(c => c.alive).length;
  }

  getTotalCount(): number {
    return this.characters.length;
  }
}
