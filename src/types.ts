export interface ProblemInput {
  id: string;
  projectId: string;
  problemStatement: string;
  definitionOfDone: string;
  constraints: string;
  engineeringCapacity: string;
  nonNegotiables: string;
  techStack: string | null;
  currentArchitecture: string | null;
  createdAt: Date;
}

export interface Clarification {
  id: string;
  projectId: string;
  question: string;
  answer: string | null;
  order: number;
  createdAt: Date;
}
