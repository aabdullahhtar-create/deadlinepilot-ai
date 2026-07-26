import { NextResponse } from "next/server";
import { createFallbackAudit, createFallbackPlan } from "@/lib/fallback";
import type { AuditInput, AuditResult, ProjectInput, ProjectPlan, ProjectTask } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 45;

type AnalyzeBody = { action: "analyze"; input: ProjectInput };
type AuditBody = { action: "audit"; input: AuditInput };
type ReadmeBody = {
  action: "readme";
  input: {
    project: ProjectInput;
    plan: ProjectPlan;
    repositoryUrl?: string;
    liveUrl?: string;
  };
};
type RequestBody = AnalyzeBody | AuditBody | ReadmeBody;

const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  required: [
    "appName",
    "oneLiner",
    "problem",
    "targetUsers",
    "mandatoryRequirements",
    "recommendedFeatures",
    "aiFeature",
    "suggestedStack",
    "tasks",
    "schedule",
    "risks",
    "successCriteria"
  ],
  properties: {
    appName: { type: "STRING" },
    oneLiner: { type: "STRING" },
    problem: { type: "STRING" },
    targetUsers: { type: "STRING" },
    mandatoryRequirements: { type: "ARRAY", items: { type: "STRING" } },
    recommendedFeatures: { type: "ARRAY", items: { type: "STRING" } },
    aiFeature: {
      type: "OBJECT",
      required: ["name", "purpose", "systemPromptSummary"],
      properties: {
        name: { type: "STRING" },
        purpose: { type: "STRING" },
        systemPromptSummary: { type: "STRING" }
      }
    },
    suggestedStack: { type: "ARRAY", items: { type: "STRING" } },
    tasks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["title", "description", "priority", "category", "estimatedHours"],
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" },
          priority: { type: "STRING", enum: ["must", "should", "optional"] },
          category: {
            type: "STRING",
            enum: ["planning", "design", "development", "testing", "deployment", "documentation"]
          },
          estimatedHours: { type: "NUMBER" }
        }
      }
    },
    schedule: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["label", "focus", "tasks", "hours"],
        properties: {
          label: { type: "STRING" },
          focus: { type: "STRING" },
          tasks: { type: "ARRAY", items: { type: "STRING" } },
          hours: { type: "NUMBER" }
        }
      }
    },
    risks: { type: "ARRAY", items: { type: "STRING" } },
    successCriteria: { type: "ARRAY", items: { type: "STRING" } }
  }
};

const AUDIT_SCHEMA = {
  type: "OBJECT",
  required: ["score", "verdict", "passedChecks", "criticalIssues", "improvements", "finalChecklist"],
  properties: {
    score: { type: "NUMBER" },
    verdict: { type: "STRING" },
    passedChecks: { type: "ARRAY", items: { type: "STRING" } },
    criticalIssues: { type: "ARRAY", items: { type: "STRING" } },
    improvements: { type: "ARRAY", items: { type: "STRING" } },
    finalChecklist: { type: "ARRAY", items: { type: "STRING" } }
  }
};

const README_SCHEMA = {
  type: "OBJECT",
  required: ["markdown"],
  properties: { markdown: { type: "STRING" } }
};

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => asText(item)).filter(Boolean).slice(0, 16) : [];
}

function safeHours(value: unknown, fallback = 1): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0.25, Math.min(12, Math.round(number * 4) / 4)) : fallback;
}

function normalizePlan(raw: Record<string, unknown>, input: ProjectInput): ProjectPlan {
  const fallback = createFallbackPlan(input);
  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const tasks: ProjectTask[] = rawTasks.slice(0, 18).map((item, index) => {
    const task = (item ?? {}) as Record<string, unknown>;
    const priorities = ["must", "should", "optional"];
    const categories = ["planning", "design", "development", "testing", "deployment", "documentation"];
    const priority = asText(task.priority).toLowerCase();
    const category = asText(task.category).toLowerCase();
    return {
      id: `task-${index + 1}`,
      title: asText(task.title, `Project task ${index + 1}`),
      description: asText(task.description, "Complete this task and verify the result."),
      priority: (priorities.includes(priority) ? priority : "must") as ProjectTask["priority"],
      category: (categories.includes(category) ? category : "development") as ProjectTask["category"],
      estimatedHours: safeHours(task.estimatedHours),
      completed: false
    };
  });

  const rawAi = (raw.aiFeature ?? {}) as Record<string, unknown>;
  const rawSchedule = Array.isArray(raw.schedule) ? raw.schedule : [];

  return {
    appName: asText(raw.appName, fallback.appName),
    oneLiner: asText(raw.oneLiner, fallback.oneLiner),
    problem: asText(raw.problem, fallback.problem),
    targetUsers: asText(raw.targetUsers, fallback.targetUsers),
    mandatoryRequirements: asStringArray(raw.mandatoryRequirements).length
      ? asStringArray(raw.mandatoryRequirements)
      : fallback.mandatoryRequirements,
    recommendedFeatures: asStringArray(raw.recommendedFeatures).length
      ? asStringArray(raw.recommendedFeatures)
      : fallback.recommendedFeatures,
    aiFeature: {
      name: asText(rawAi.name, fallback.aiFeature.name),
      purpose: asText(rawAi.purpose, fallback.aiFeature.purpose),
      systemPromptSummary: asText(rawAi.systemPromptSummary, fallback.aiFeature.systemPromptSummary)
    },
    suggestedStack: asStringArray(raw.suggestedStack).length ? asStringArray(raw.suggestedStack) : fallback.suggestedStack,
    tasks: tasks.length >= 4 ? tasks : fallback.tasks,
    schedule: rawSchedule.slice(0, 8).map((item, index) => {
      const block = (item ?? {}) as Record<string, unknown>;
      return {
        label: asText(block.label, `Phase ${index + 1}`),
        focus: asText(block.focus, "Complete the assigned tasks"),
        tasks: asStringArray(block.tasks),
        hours: safeHours(block.hours, 2)
      };
    }),
    risks: asStringArray(raw.risks).length ? asStringArray(raw.risks) : fallback.risks,
    successCriteria: asStringArray(raw.successCriteria).length ? asStringArray(raw.successCriteria) : fallback.successCriteria,
    generatedBy: "gemini"
  };
}

function normalizeAudit(raw: Record<string, unknown>, input: AuditInput): AuditResult {
  const fallback = createFallbackAudit(input);
  const score = Math.max(0, Math.min(100, Math.round(Number(raw.score) || fallback.score)));
  return {
    score,
    verdict: asText(raw.verdict, fallback.verdict),
    passedChecks: asStringArray(raw.passedChecks),
    criticalIssues: asStringArray(raw.criticalIssues),
    improvements: asStringArray(raw.improvements),
    finalChecklist: asStringArray(raw.finalChecklist).length ? asStringArray(raw.finalChecklist) : fallback.finalChecklist,
    generatedBy: "gemini"
  };
}

async function callGemini(systemInstruction: string, userPrompt: string, schema: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: "application/json",
          responseSchema: schema
        }
      }),
      signal: AbortSignal.timeout(40000)
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Gemini API error", response.status, detail.slice(0, 500));
    throw new Error("AI_REQUEST_FAILED");
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("EMPTY_AI_RESPONSE");
  return JSON.parse(text) as Record<string, unknown>;
}

function fallbackReadme(input: ReadmeBody["input"]): string {
  const { project, plan, repositoryUrl, liveUrl } = input;
  const requirements = plan.mandatoryRequirements.map((item) => `- ${item}`).join("\n");
  const features = plan.recommendedFeatures.map((item) => `- ${item}`).join("\n");
  const stack = plan.suggestedStack.map((item) => `- ${item}`).join("\n");

  return `# ${plan.appName}\n\n> ${plan.oneLiner}\n\n## Live Application\n\n- **Live URL:** ${liveUrl || "Add your deployed URL here"}\n- **Repository:** ${repositoryUrl || "Add your public GitHub repository URL here"}\n\n## Problem\n\n${plan.problem}\n\n## Who It Helps\n\n${plan.targetUsers}\n\n## Features\n\n${features}\n\n## Requirements Covered\n\n${requirements}\n\n## AI Feature\n\n### ${plan.aiFeature.name}\n\n${plan.aiFeature.purpose}\n\n**Prompt strategy:** ${plan.aiFeature.systemPromptSummary}\n\nThe AI request is sent through a server-side Next.js Route Handler. The API key is stored in an environment variable and is never exposed to the browser.\n\n## Tools and Technologies\n\n${stack}\n\n## Screenshots\n\n![Project analyzer](public/screenshots/analyzer.png)\n\n![Progress dashboard](public/screenshots/dashboard.png)\n\n![Submission audit](public/screenshots/audit.png)\n\n## Run Locally\n\n1. Clone the repository.\n2. Install dependencies with \`npm install\`.\n3. Copy \`.env.example\` to \`.env.local\`.\n4. Add your Gemini API key.\n5. Start the development server with \`npm run dev\`.\n6. Open \`http://localhost:3000\`.\n\n## Environment Variables\n\n\`\`\`env\nGEMINI_API_KEY=your_gemini_api_key_here\nGEMINI_MODEL=gemini-2.5-flash\n\`\`\`\n\n## Deployment\n\nDeploy the repository to Vercel and add the same environment variables in the Vercel project settings.\n\n## Privacy and Security\n\n- The Gemini key remains server-side.\n- Project progress is stored in the user's browser.\n- No account or database is required.\n- Secrets are excluded from Git through \`.gitignore\`.\n\n## Project Input\n\n- **Deadline:** ${project.deadline || "Not specified"}\n- **Experience level:** ${project.experience}\n- **Available hours per day:** ${project.hoursPerDay}\n\n## Future Improvements\n\n- Optional user accounts and cloud synchronization\n- Automated public URL availability checks\n- GitHub repository analysis through OAuth\n- Calendar export for the generated schedule\n\n## License\n\nThis project is provided for educational use.\n`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (body.action === "analyze") {
      const input = body.input;
      if (!input?.brief || input.brief.trim().length < 80) {
        return NextResponse.json({ error: "Please provide a project brief of at least 80 characters." }, { status: 400 });
      }

      try {
        const raw = await callGemini(
          `You are DeadlinePilot AI, a strict project analyst for students and independent builders. Extract requirements only from the supplied brief. Separate compulsory work from helpful additions. Recommend the smallest complete MVP that can be built by the deadline. Do not invent grading rules. Keep tasks actionable, non-overlapping, and realistically estimated. Return only JSON matching the schema.`,
          `Analyze this project brief.\n\nProject name: ${input.projectName || "Not chosen"}\nDeadline: ${input.deadline || "Not specified"}\nExperience: ${input.experience}\nAvailable hours per day: ${input.hoursPerDay}\n\nBRIEF:\n${input.brief.slice(0, 18000)}`,
          ANALYSIS_SCHEMA
        );
        return NextResponse.json({ data: normalizePlan(raw, input), notice: null });
      } catch (error) {
        console.error("Analyze fallback", error);
        return NextResponse.json({
          data: createFallbackPlan(input),
          notice: "Gemini was unavailable, so DeadlinePilot used its built-in planning engine. Add a valid server-side API key for live AI analysis."
        });
      }
    }

    if (body.action === "audit") {
      const input = body.input;
      try {
        const raw = await callGemini(
          `You are a demanding final-project grader. Audit the supplied submission evidence against common requirements: original useful idea, complete end-to-end workflow, meaningful AI feature, public repository, working live deployment, strong README, at least three screenshots, setup instructions, documented AI prompt, and no exposed secrets. Be specific and fair. URLs are user-provided evidence only; do not claim you opened them. Return only JSON matching the schema.`,
          `Audit this submission evidence:\nRepository URL: ${input.repositoryUrl || "Missing"}\nLive URL: ${input.liveUrl || "Missing"}\nScreenshot count: ${input.screenshotsCount}\nClaimed features:\n${input.claimedFeatures.slice(0, 6000)}\n\nREADME:\n${input.readme.slice(0, 16000)}`,
          AUDIT_SCHEMA
        );
        return NextResponse.json({ data: normalizeAudit(raw, input), notice: null });
      } catch (error) {
        console.error("Audit fallback", error);
        return NextResponse.json({
          data: createFallbackAudit(input),
          notice: "Gemini was unavailable, so the audit used deterministic submission checks."
        });
      }
    }

    if (body.action === "readme") {
      const input = body.input;
      try {
        const raw = await callGemini(
          `You write excellent GitHub README files for student software projects. Use only the supplied facts. Produce polished Markdown with these sections: title and one-line pitch, live URL, repository URL, problem, target users, features, AI feature and exact prompt strategy, technology stack, at least three screenshot placeholders using public/screenshots/analyzer.png, dashboard.png, and audit.png, local setup, environment variables, deployment, privacy/security, project structure, future improvements, and license. Never include a real API key. Return JSON with one markdown field.`,
          `Create the README from this project data:\n${JSON.stringify(input).slice(0, 24000)}`,
          README_SCHEMA
        );
        const markdown = asText(raw.markdown, fallbackReadme(input));
        return NextResponse.json({ data: { markdown }, notice: null });
      } catch (error) {
        console.error("README fallback", error);
        return NextResponse.json({
          data: { markdown: fallbackReadme(input) },
          notice: "Gemini was unavailable, so a complete template-based README was generated."
        });
      }
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("API route error", error);
    return NextResponse.json({ error: "The request could not be processed." }, { status: 500 });
  }
}
