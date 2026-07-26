export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type Priority = "must" | "should" | "optional";
export type TaskCategory = "planning" | "design" | "development" | "testing" | "deployment" | "documentation";

export interface ProjectInput {
  projectName: string;
  brief: string;
  deadline: string;
  experience: ExperienceLevel;
  hoursPerDay: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  estimatedHours: number;
  completed: boolean;
}

export interface ScheduleBlock {
  label: string;
  focus: string;
  tasks: string[];
  hours: number;
}

export interface ProjectPlan {
  appName: string;
  oneLiner: string;
  problem: string;
  targetUsers: string;
  mandatoryRequirements: string[];
  recommendedFeatures: string[];
  aiFeature: {
    name: string;
    purpose: string;
    systemPromptSummary: string;
  };
  suggestedStack: string[];
  tasks: ProjectTask[];
  schedule: ScheduleBlock[];
  risks: string[];
  successCriteria: string[];
  generatedBy: "gemini" | "fallback";
}

export interface AuditInput {
  repositoryUrl: string;
  liveUrl: string;
  readme: string;
  screenshotsCount: number;
  claimedFeatures: string;
}

export interface AuditResult {
  score: number;
  verdict: string;
  passedChecks: string[];
  criticalIssues: string[];
  improvements: string[];
  finalChecklist: string[];
  generatedBy: "gemini" | "fallback";
}

export interface StoredProject {
  input: ProjectInput;
  plan: ProjectPlan | null;
  audit: AuditResult | null;
  readme: string;
}
