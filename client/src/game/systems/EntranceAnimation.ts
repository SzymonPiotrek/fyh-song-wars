import * as Matter from 'matter-js';
import { Character } from '../../../../shared/types/Character';
import { Arena } from '../../../../shared/types/Arena';

/**
 * Manages the theatrical character entrance sequence.
 * Characters drop from a chute above the arena with gravity,
 * bounce/ragdoll on landing, then settle before the fight begins.
 */
export class EntranceAnimation {
  private engine: Matter.Engine;
  private world: Matter.World;
  private bodies: Map<string, Matter.Body> = new Map();
  private ragdollParts: Map<string, Matter.Body[]> = new Map();
  
  // Character state during entrance
  private settled: Map<string, boolean> = new Map();
  private settlingTimer: Map<string, number> = new Map();
  
  private arena: Arena | null = null;
  private arenaFloorY: number = 0;
  
  // Timing
  private dropInterval: number = 300; // ms between each character drop
  private dropOrder: string[] = [];
  private dropIndex: number = 0;
  private dropStartTime: number = 0;
  
  // Phase: 'dropping' | 'settling' | 'complete'
  private phase: 'idle' | 'dropping' | 'settling' | 'complete' = 'idle';
  
  // Callbacks
  private onEntranceComplete?: () => void;
  
  // Gravity settings
  private readonly gravityY: number = 1.2;
  private readonly bounceRestitution: number = 0.4;
  private readonly settleThreshold: number = 5; // velocity below this = settled
  private readonly settleTime: number = 800; // ms of low velocity before considered settled

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: this.gravityY }
    });
    this.world = this.engine.world;
  }

  setArena(arena: Arena) {
    this.arena = arena;
    this.arenaFloorY = arena.height - 30; // floor is near bottom
    this.createBoundaries(arena);
  }

  private createBoundaries(arena: Arena) {
    const thickness = 50;
    const w = arena.width;
    const h = arena.height;

    // Floor — solid ground for characters to land on
    const floor = Matter.Bodies.rectangle(
      w / 2, h + thickness / 4, w + thickness * 2, thickness,
      { isStatic: true, restitution: this.bounceRestitution }
    );

    // Left wall
    const leftWall = Matter.Bodies.rectangle(
      -thickness / 2, h / 2, thickness, h + thickness * 2,
      { isStatic: true }
    );

    // Right wall
    const rightWall = Matter.Bodies.rectangle(
      w + thickness / 2, h / 2, thickness, h + thickness * 2,
      { isStatic: true }
    );

    Matter.World.add(this.world, [floor, leftWall, rightWall]);
  }

  /**
   * Prepare characters for entrance animation.
   * Characters are positioned above the arena, ready to drop.
   */
  prepare(characters: Character[], arena: Arena) {
    this.arena = arena;
    this.arenaFloorY = arena.height - 30;
    this.phase = 'dropping';
    this.dropIndex = 0;
    this.dropStartTime = Date.now();
    this.settled.clear();
    this.settlingTimer.clear();
    this.bodies.clear();
    this.ragdollParts.clear();

    // Create random drop order
    this.dropOrder = characters.map(c => c.id);
    for (let i = this.dropOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.dropOrder[i], this.dropOrder[j]] = [this.dropOrder[j], this.dropOrder[i]];
    }

    // Position characters above the arena (in the chute)
    const chuteX = arena.width / 2;
    const chuteY = -50; // above visible area

    characters.forEach(character => {
      // Start position: clustered near the chute
      character.position.x = chuteX + (Math.random() - 0.5) * 60;
      character.position.y = chuteY - Math.random() * 80;
      character.velocity.x = 0;
      character.velocity.y = 0;
      
      this.settled.set(character.id, false);
      this.settlingTimer.set(character.id, 0);

      // Create ragdoll body parts for each character
      this.createRagdoll(character);
    });
  }

  /**
   * Create ragdoll physics bodies for a character.
   * Each character gets a head, torso, upper arms, forearms, upper legs, and lower legs.
   */
  private createRagdoll(character: Character) {
    const x = character.position.x;
    const y = character.position.y;
    const size = character.size;
    
    const headRadius = 11 * size;
    const torsoWidth = 8 * size;
    const torsoHeight = 20 * size;
    const limbWidth = 3 * size;
    const limbLength = 16 * size;

    const parts: Matter.Body[] = [];

    // Head
    const head = Matter.Bodies.circle(x, y - 30 * size, headRadius, {
      restitution: this.bounceRestitution,
      friction: 0.5,
      frictionAir: 0.02,
      density: 0.01
    });
    parts.push(head);

    // Torso
    const torso = Matter.Bodies.rectangle(x, y - 5, torsoWidth, torsoHeight, {
      restitution: this.bounceRestitution,
      friction: 0.5,
      frictionAir: 0.02,
      density: 0.01
    });
    parts.push(torso);

    // Upper arms (2)
    const leftUpperArm = Matter.Bodies.rectangle(x - 10 * size, y - 15 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.5,
      friction: 0.3,
      frictionAir: 0.03,
      density: 0.008
    });
    const rightUpperArm = Matter.Bodies.rectangle(x + 10 * size, y - 15 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.5,
      friction: 0.3,
      frictionAir: 0.03,
      density: 0.008
    });
    parts.push(leftUpperArm, rightUpperArm);

    // Forearms (2)
    const leftForearm = Matter.Bodies.rectangle(x - 10 * size, y + 5 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.3,
      friction: 0.3,
      frictionAir: 0.03,
      density: 0.006
    });
    const rightForearm = Matter.Bodies.rectangle(x + 10 * size, y + 5 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.3,
      friction: 0.3,
      frictionAir: 0.03,
      density: 0.006
    });
    parts.push(leftForearm, rightForearm);

    // Upper legs (2)
    const leftUpperLeg = Matter.Bodies.rectangle(x - 5 * size, y + 15 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.5,
      friction: 0.4,
      frictionAir: 0.02,
      density: 0.008
    });
    const rightUpperLeg = Matter.Bodies.rectangle(x + 5 * size, y + 15 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.5,
      friction: 0.4,
      frictionAir: 0.02,
      density: 0.008
    });
    parts.push(leftUpperLeg, rightUpperLeg);

    // Lower legs (2)
    const leftLowerLeg = Matter.Bodies.rectangle(x - 5 * size, y + 35 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.3,
      friction: 0.5,
      frictionAir: 0.02,
      density: 0.006
    });
    const rightLowerLeg = Matter.Bodies.rectangle(x + 5 * size, y + 35 * size, limbWidth, limbLength, {
      restitution: this.bounceRestitution * 0.3,
      friction: 0.5,
      frictionAir: 0.02,
      density: 0.006
    });
    parts.push(leftLowerLeg, rightLowerLeg);

    // Create constraints to connect body parts (joints)
    const constraints: Matter.Constraint[] = [];

    // Head to torso (neck)
    constraints.push(Matter.Constraint.create({
      bodyA: head,
      bodyB: torso,
      pointA: { x: 0, y: headRadius },
      pointB: { x: 0, y: -torsoHeight / 2 },
      stiffness: 0.1,
      length: 0
    }));

    // Upper arms to torso (shoulders)
    constraints.push(Matter.Constraint.create({
      bodyA: leftUpperArm,
      bodyB: torso,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: -torsoWidth / 2, y: -torsoHeight / 3 },
      stiffness: 0.15,
      length: 0
    }));
    constraints.push(Matter.Constraint.create({
      bodyA: rightUpperArm,
      bodyB: torso,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: torsoWidth / 2, y: -torsoHeight / 3 },
      stiffness: 0.15,
      length: 0
    }));

    // Forearms to upper arms (elbows)
    constraints.push(Matter.Constraint.create({
      bodyA: leftForearm,
      bodyB: leftUpperArm,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: 0, y: limbLength / 2 },
      stiffness: 0.1,
      length: 0
    }));
    constraints.push(Matter.Constraint.create({
      bodyA: rightForearm,
      bodyB: rightUpperArm,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: 0, y: limbLength / 2 },
      stiffness: 0.1,
      length: 0
    }));

    // Upper legs to torso (hips)
    constraints.push(Matter.Constraint.create({
      bodyA: leftUpperLeg,
      bodyB: torso,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: -torsoWidth / 3, y: torsoHeight / 2 },
      stiffness: 0.15,
      length: 0
    }));
    constraints.push(Matter.Constraint.create({
      bodyA: rightUpperLeg,
      bodyB: torso,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: torsoWidth / 3, y: torsoHeight / 2 },
      stiffness: 0.15,
      length: 0
    }));

    // Lower legs to upper legs (knees)
    constraints.push(Matter.Constraint.create({
      bodyA: leftLowerLeg,
      bodyB: leftUpperLeg,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: 0, y: limbLength / 2 },
      stiffness: 0.1,
      length: 0
    }));
    constraints.push(Matter.Constraint.create({
      bodyA: rightLowerLeg,
      bodyB: rightUpperLeg,
      pointA: { x: 0, y: -limbLength / 2 },
      pointB: { x: 0, y: limbLength / 2 },
      stiffness: 0.1,
      length: 0
    }));

    // Add all parts and constraints to the world
    Matter.World.add(this.world, [...parts, ...constraints]);
    this.ragdollParts.set(character.id, parts);
    
    // Store the main body (torso) for position tracking
    this.bodies.set(character.id, torso);
  }

  /**
   * Update the entrance animation.
   * Returns true when all characters have settled and the fight can begin.
   */
  update(delta: number): boolean {
    if (this.phase === 'complete') return true;
    if (this.phase === 'idle') return false;

    const now = Date.now();
    const deltaTime = delta / 60;

    // Drop characters one by one
    if (this.phase === 'dropping' && this.dropIndex < this.dropOrder.length) {
      const timeSinceLastDrop = now - this.dropStartTime;
      if (timeSinceLastDrop >= this.dropInterval) {
        const charId = this.dropOrder[this.dropIndex];
        const char = this.getCharacterById(charId);
        
        if (char) {
          // Give each character a slight random horizontal velocity for variety
          const parts = this.ragdollParts.get(charId);
          if (parts) {
            const randomX = (Math.random() - 0.5) * 3;
            parts.forEach(part => {
              Matter.Body.setVelocity(part, { x: randomX, y: 0 });
              Matter.Body.setAngularVelocity(part, (Math.random() - 0.5) * 0.1);
            });
          }
        }
        
        this.dropIndex++;
        this.dropStartTime = now;
      }
    }

    // Update physics
    Matter.Engine.update(this.engine, 1000 / 60);

    // Sync character positions from ragdoll torso
    for (const charId of this.dropOrder) {
      const parts = this.ragdollParts.get(charId);
      const body = this.bodies.get(charId);
      
      if (parts && body) {
        // Character position follows the torso
        const char = this.getCharacterById(charId);
        if (char) {
          char.position.x = body.position.x;
          char.position.y = body.position.y;

          // Check if character has settled
          const speed = Math.sqrt(
            body.velocity.x ** 2 + body.velocity.y ** 2
          );
          const angularSpeed = Math.abs(body.angularVelocity);

          if (speed < this.settleThreshold && angularSpeed < 0.05) {
            const timer = this.settlingTimer.get(charId) || 0;
            this.settlingTimer.set(charId, timer + deltaTime * 1000);
            
            if (timer >= this.settleTime) {
              this.settled.set(charId, true);
              
              // Dampen remaining motion
              parts.forEach(part => {
                Matter.Body.setVelocity(part, { x: 0, y: 0 });
                Matter.Body.setAngularVelocity(part, 0);
              });
            }
          } else {
            this.settlingTimer.set(charId, 0);
          }
        }
      }
    }

    // Check if all dropped characters have settled
    const allDropped = this.dropIndex >= this.dropOrder.length;
    const allSettled = this.dropOrder.every(id => this.settled.get(id));

    if (allDropped && allSettled) {
      this.phase = 'complete';
      if (this.onEntranceComplete) {
        this.onEntranceComplete();
      }
      return true;
    }

    return false;
  }

  private getCharacterById(id: string): Character | null {
    // This will be set by BattleManager
    return null;
  }

  setCharacterGetter(getter: (id: string) => Character | undefined) {
    // Store reference to get characters
    const originalGetById = this.getCharacterById.bind(this);
    this.getCharacterById = (id: string) => {
      return getter(id) || originalGetById(id);
    };
  }

  setOnComplete(callback: () => void) {
    this.onEntranceComplete = callback;
  }

  getPhase(): 'idle' | 'dropping' | 'settling' | 'complete' {
    return this.phase;
  }

  isComplete(): boolean {
    return this.phase === 'complete';
  }

  /**
   * Get the ragdoll parts for rendering
   */
  getRagdollParts(charId: string): Matter.Body[] | undefined {
    return this.ragdollParts.get(charId);
  }

  /**
   * Get all ragdoll parts as a Map for the renderer
   */
  getRagdollPartsMap(): Map<string, Matter.Body[]> {
    return this.ragdollParts;
  }

  /**
   * Get the main body (torso) for a character
   */
  getBody(charId: string): Matter.Body | undefined {
    return this.bodies.get(charId);
  }

  /**
   * Clean up physics world
   */
  cleanup() {
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
    this.bodies.clear();
    this.ragdollParts.clear();
    this.settled.clear();
    this.settlingTimer.clear();
  }

  /**
   * Get the chute position for rendering
   */
  getChutePosition(): { x: number; y: number } {
    if (!this.arena) return { x: 0, y: 0 };
    return { x: this.arena.width / 2, y: -30 };
  }
}
