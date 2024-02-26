export class EntityAttribute {
  constructor(public name: string, public type: string) {}
}

export class Entity {
  constructor(public label: string, public attributes: EntityAttribute[]) {}
}

export class EntityConfig {
  constructor(public version: string, public entities: Entity[]) {}
}
