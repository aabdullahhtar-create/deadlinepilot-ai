import type { AuditInput, AuditResult, ProjectInput, ProjectPlan, ProjectTask } from "./types";

const cleanLines = (text: string) =>
  text
    .split(/\n|\.|;/)
    .map((line) => line.replace(/^[-•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 12)
    .slice(0, 8);

export function createFallbackPlan(input: ProjectInput): ProjectPlan {
  const extracted = cleanLines(input.brief);
  const mandatoryRequirements = extracted.length
    ? extracted
    : ["Build a complete working application", "Include an AI-powered feature", "Deploy the application publicly", "Document the project clearly"];

  const tasks: ProjectTask[] = [
    ["Define the MVP", "Turn the brief into a strict must-have feature list.", "must", "planning", 0.5],
    ["Create the core interface", "Build the main user flow with responsive states and validation.", "must", "development", 2],
    ["Integrate the AI feature", "Connect the server-side AI endpoint and handle structured responses.", "must", "development", 1.5],
    ["Persist user progress", "Save project data locally so work survives refreshes.", "should", "development", 0.75],
    ["Test key workflows", "Test valid inputs, errors, empty states, and mobile layout.", "must", "testing", 1],
    ["Deploy the application", "Add environment variables and deploy to a public URL.", "must", "deployment", 0.75],
    ["Write the project README", "Document the problem, features, AI prompt, stack, setup, and screenshots.", "must", "documentation", 1],
    ["Capture screenshots", "Add at least three screenshots showing the complete workflow.", "must", "documentation", 0.5]
  ].map(([title, description, priority, category, estimatedHours], index) => ({
    id: `task-${index + 1}`,
    title: String(title),
    description: String(description),
    priority: priority as ProjectTask["priority"],
    category: category as ProjectTask["category"],
    estimatedHours: Number(estimatedHours),
    completed: false,
  }));

  return {
    appName: input.projectName || "My AI Project",
    oneLiner: "A focused AI-assisted application built around the supplied project brief.",
    problem: "People lose time interpreting long requirements and often miss critical submission details.",
    targetUsers: "Students, interns, and independent builders working under short deadlines.",
    mandatoryRequirements,
    recommendedFeatures: ["Clear primary workflow", "Helpful empty and error states", "Progress persistence", "Responsive design", "Exportable output"],
    aiFeature: {
      name: "AI Project Analyst",
      purpose: "Converts an unstructured brief into requirements, tasks, risks, and an achievable execution plan.",
      systemPromptSummary: "Act as a strict project evaluator, separate mandatory from optional work, avoid inventing requirements, and return structured JSON."
    },
    suggestedStack: ["Next.js", "TypeScript", "Gemini API", "CSS", "Vercel"],
    tasks,
    schedule: [
      { label: "Phase 1", focus: "Scope and interface", tasks: ["Define the MVP", "Create the core interface"], hours: 2.5 },
      { label: "Phase 2", focus: "AI and persistence", tasks: ["Integrate the AI feature", "Persist user progress"], hours: 2.25 },
      { label: "Phase 3", focus: "Finish and ship", tasks: ["Test key workflows", "Deploy the application", "Write the project README", "Capture screenshots"], hours: 3.25 }
    ],
    risks: ["Trying to add too many features", "Exposing the API key in client code", "Deploying without testing environment variables", "Claiming features that are not demonstrated"],
    successCriteria: ["The primary workflow works end to end", "The AI feature produces useful structured output", "The public URL opens without login", "The README contains every required section"],
    generatedBy: "fallback"
  };
}

export function createFallbackAudit(input: AuditInput): AuditResult {
  const passedChecks: string[] = [];
  const criticalIssues: string[] = [];
  const improvements: string[] = [];

  if (/^https:\/\/github\.com\/.+\/.+/.test(input.repositoryUrl)) passedChecks.push("A GitHub repository URL is provided.");
  else criticalIssues.push("Add a valid public GitHub repository URL.");

  if (/^https:\/\//.test(input.liveUrl)) passedChecks.push("A secure live application URL is provided.");
  else criticalIssues.push("Add a working HTTPS deployment URL.");

  if (input.readme.length >= 900) passedChecks.push("The README has substantial project documentation.");
  else criticalIssues.push("Expand the README with the problem, features, AI prompt, stack, setup, and deployment details.");

  if (input.screenshotsCount >= 3) passedChecks.push("At least three screenshots are included.");
  else criticalIssues.push("Add at least three screenshots of the app in action.");

  if (/AI|Gemini|prompt|model/i.test(input.readme)) passedChecks.push("The AI feature is described in the README.");
  else improvements.push("Explain what the AI does and include the system prompt or prompt strategy.");

  const score = Math.max(20, Math.min(100, 100 - criticalIssues.length * 18 - improvements.length * 7));
  return {
    score,
    verdict: score >= 85 ? "Submission-ready with minor final checks." : score >= 65 ? "Close, but fix the listed issues before submitting." : "Not submission-ready yet.",
    passedChecks,
    criticalIssues,
    improvements,
    finalChecklist: ["Open the repository in an incognito window", "Open and test the live URL", "Run the main workflow once", "Confirm no secrets are committed", "Submit only the public repository link"],
    generatedBy: "fallback"
  };
}
