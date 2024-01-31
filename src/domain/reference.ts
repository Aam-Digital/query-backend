export class Reference {
  constructor(id: string, type: string | null = null) {
    this.id = id;
    this.type = type;
  }

  id: string;
  type: string | null;
}
