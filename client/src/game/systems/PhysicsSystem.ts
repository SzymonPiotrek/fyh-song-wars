import * as Matter from 'matter-js';
import { Character } from '../../../../shared/types/Character';
import { Arena } from '../../../../shared/types/Arena';

export class PhysicsSystem {
  private engine: Matter.Engine;
  private world: Matter.World;
  private bodies: Map<string, Matter.Body> = new Map();
  private arena: Arena | null = null;

  constructor() {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 } // Top-down view, no gravity
    });
    this.world = this.engine.world;
  }

  setArena(arena: Arena) {
    this.arena = arena;
    this.createBoundaries(arena);
  }

  private createBoundaries(arena: Arena) {
    const thickness = 50;
    const w = arena.width;
    const h = arena.height;

    const walls = [
      // Top wall
      Matter.Bodies.rectangle(w / 2, -thickness / 2, w + thickness * 2, thickness, { isStatic: true }),
      // Bottom wall
      Matter.Bodies.rectangle(w / 2, h + thickness / 2, w + thickness * 2, thickness, { isStatic: true }),
      // Left wall
      Matter.Bodies.rectangle(-thickness / 2, h / 2, thickness, h + thickness * 2, { isStatic: true }),
      // Right wall
      Matter.Bodies.rectangle(w + thickness / 2, h / 2, thickness, h + thickness * 2, { isStatic: true })
    ];

    Matter.World.add(this.world, walls);
  }

  addCharacter(character: Character) {
    const size = 20 * character.size;
    const body = Matter.Bodies.circle(character.position.x, character.position.y, size, {
      restitution: 0.5,
      friction: 0.3,
      frictionAir: 0.1,
      label: character.id
    });

    this.bodies.set(character.id, body);
    Matter.World.add(this.world, body);
  }

  removeCharacter(characterId: string) {
    const body = this.bodies.get(characterId);
    if (body) {
      Matter.World.remove(this.world, body);
      this.bodies.delete(characterId);
    }
  }

  updateCharacterPosition(character: Character) {
    const body = this.bodies.get(character.id);
    if (body) {
      Matter.Body.setPosition(body, {
        x: character.position.x,
        y: character.position.y
      });
      Matter.Body.setVelocity(body, {
        x: character.velocity.x,
        y: character.velocity.y
      });
    }
  }

  getCharacterBody(characterId: string): Matter.Body | undefined {
    return this.bodies.get(characterId);
  }

  checkCollision(char1: Character, char2: Character, distance: number): boolean {
    const body1 = this.bodies.get(char1.id);
    const body2 = this.bodies.get(char2.id);

    if (!body1 || !body2) return false;

    const size1 = 20 * char1.size;
    const size2 = 20 * char2.size;
    const collisionDistance = size1 + size2;

    return distance < collisionDistance;
  }

  isInsideArena(x: number, y: number): boolean {
    if (!this.arena) return true;
    return x >= 0 && x <= this.arena.width && y >= 0 && y <= this.arena.height;
  }

  update() {
    Matter.Engine.update(this.engine, 1000 / 60);
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }

  getWorld(): Matter.World {
    return this.world;
  }
}
