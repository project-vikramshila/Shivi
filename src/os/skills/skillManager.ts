export type SkillDefinition = {
  id: string;
  name: string;
  description: string;
  version: string;
  pluginId?: string;
  inputSchema?: Record<string, any>;
  execute: (input: Record<string, any>) => Promise<any>;
};

export class SkillManager {
  private skills: Record<string, SkillDefinition> = {};

  registerSkill(skill: SkillDefinition) {
    if (!skill.id || !skill.name || !skill.execute) {
      throw new Error('Skill must have id, name, and execute function');
    }

    this.skills[skill.id] = skill;
  }

  listSkills() {
    return Object.values(this.skills);
  }

  getSkill(id: string) {
    return this.skills[id] || null;
  }

  async executeSkill(id: string, input: Record<string, any>) {
    const skill = this.skills[id];
    if (!skill) {
      throw new Error(`Skill not found: ${id}`);
    }
    return await skill.execute(input);
  }
}
