/**
 * Turma — agrupamento acadêmico de alunos para um tópico em determinado
 * ano/semestre, com um conjunto fixo de metas avaliáveis.
 *
 * O nome `ClassGroup` evita conflito com a palavra reservada `class` do TypeScript.
 */
export interface ClassGroup {
  id: string;
  topic: string;
  year: number;
  semester: 1 | 2;
  studentIds: string[];
  goalIds: string[];
  createdAt: Date;
  updatedAt: Date;
}
