"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuditInput, AuditResult, Priority, ProjectInput, ProjectPlan, StoredProject } from "@/lib/types";

type Tab = "analyze" | "dashboard" | "audit" | "readme";

const PROJECT_KEY = "deadlinepilot-project-v1";
const AUDIT_KEY = "deadlinepilot-audit-v1";

const initialInput: ProjectInput = {
  projectName: "",
  brief: "",
  deadline: "",
  experience: "intermediate",
  hoursPerDay: 6,
};

const initialProject: StoredProject = {
  input: initialInput,
  plan: null,
  audit: null,
  readme: "",
};

const initialAuditInput: AuditInput = {
  repositoryUrl: "",
  liveUrl: "",
  readme: "",
  screenshotsCount: 0,
  claimedFeatures: "",
};

const sampleBrief = `Final Project — Ship Your AI App. Build a complete, original application that solves a real problem for real people. The app must include a meaningful AI-powered feature driven by instructions written by the student. The code must be stored in a public GitHub repository and the app must be deployed at a public URL that works without login. The README is the full project report and must include the app name, problem and target users, clickable live URL, complete features list, explanation of the AI feature and system prompt, tools and models used, at least three screenshots, and local setup instructions. API keys must never be committed. The submission must contain only the public GitHub repository link.`;

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, React.ReactNode> = {
    spark: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7L12 3Z"/><path d="m19 15-.8 2.2L16 18l2.2.8L19 21l.8-2.2L22 18l-2.2-.8L19 15Z"/></>,
    analyze: <><path d="M4 19.5V4.5A1.5 1.5 0 0 1 5.5 3h13A1.5 1.5 0 0 1 20 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5Z"/><path d="M8 8h8M8 12h5M8 16h7"/></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    audit: <><path d="M9 11 11 13 15 9"/><path d="M12 3 5 6v5c0 4.6 2.9 8.7 7 10 4.1-1.3 7-5.4 7-10V6l-7-3Z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    alert: <><path d="M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/></>,
    external: <><path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    github: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 2a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4"/><path d="M8 19c-3 .9-3-1.5-4-2"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };

  return <svg {...common}>{paths[name] ?? paths.spark}</svg>;
}

function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(2)}h`;
}

function priorityLabel(priority: Priority) {
  return priority === "must" ? "Must do" : priority === "should" ? "Should do" : "Optional";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [project, setProject] = useState<StoredProject>(initialProject);
  const [auditInput, setAuditInput] = useState<AuditInput>(initialAuditInput);
  const [loading, setLoading] = useState<"analyze" | "audit" | "readme" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    try {
      const storedProject = localStorage.getItem(PROJECT_KEY);
      const storedAudit = localStorage.getItem(AUDIT_KEY);
      if (storedProject) setProject(JSON.parse(storedProject));
      if (storedAudit) setAuditInput(JSON.parse(storedAudit));
    } catch {
      localStorage.removeItem(PROJECT_KEY);
      localStorage.removeItem(AUDIT_KEY);
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  }, [project, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem(AUDIT_KEY, JSON.stringify(auditInput));
  }, [auditInput, mounted]);

  const completedTasks = project.plan?.tasks.filter((task) => task.completed).length ?? 0;
  const totalTasks = project.plan?.tasks.length ?? 0;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHours = project.plan?.tasks.reduce((sum, task) => sum + task.estimatedHours, 0) ?? 0;
  const remainingHours = project.plan?.tasks.filter((task) => !task.completed).reduce((sum, task) => sum + task.estimatedHours, 0) ?? 0;

  const criticalRemaining = useMemo(
    () => project.plan?.tasks.filter((task) => task.priority === "must" && !task.completed).length ?? 0,
    [project.plan]
  );

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "analyze", label: "Analyze", icon: "analyze" },
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "audit", label: "Audit", icon: "audit" },
    { id: "readme", label: "README", icon: "file" },
  ];

  function updateInput<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setProject((current) => ({ ...current, input: { ...current.input, [key]: value } }));
  }

  function loadSample() {
    setProject((current) => ({
      ...current,
      input: {
        projectName: "DeadlinePilot AI",
        brief: sampleBrief,
        deadline: tomorrowDate(),
        experience: "intermediate",
        hoursPerDay: 8,
      },
    }));
    setError("");
    setNotice("Sample final-project brief loaded. You can edit it before analysis.");
  }

  async function analyzeProject(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (project.input.brief.trim().length < 80) {
      setError("Paste a project brief of at least 80 characters so the analysis has enough context.");
      return;
    }

    setLoading("analyze");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", input: project.input }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed.");

      const plan = result.data as ProjectPlan;
      setProject((current) => ({ ...current, plan, audit: null, readme: "" }));
      setAuditInput((current) => ({
        ...current,
        claimedFeatures: plan.recommendedFeatures.join("\n"),
      }));
      setNotice(result.notice || "Project brief analyzed successfully. Your execution plan is ready.");
      setActiveTab("dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The project could not be analyzed.");
    } finally {
      setLoading(null);
    }
  }

  function toggleTask(taskId: string) {
    setProject((current) => {
      if (!current.plan) return current;
      return {
        ...current,
        plan: {
          ...current.plan,
          tasks: current.plan.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        },
      };
    });
  }

  async function runAudit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    const input = { ...auditInput, readme: auditInput.readme || project.readme };
    setLoading("audit");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "audit", input }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Audit failed.");
      setProject((current) => ({ ...current, audit: result.data as AuditResult }));
      setAuditInput(input);
      setNotice(result.notice || "Submission audit completed.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The submission could not be audited.");
    } finally {
      setLoading(null);
    }
  }

  async function generateReadme() {
    if (!project.plan) {
      setError("Analyze a project before generating its README.");
      setActiveTab("analyze");
      return;
    }

    setError("");
    setNotice("");
    setLoading("readme");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "readme",
          input: {
            project: project.input,
            plan: project.plan,
            repositoryUrl: auditInput.repositoryUrl,
            liveUrl: auditInput.liveUrl,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "README generation failed.");
      const markdown = String(result.data.markdown || "");
      setProject((current) => ({ ...current, readme: markdown }));
      setAuditInput((current) => ({ ...current, readme: markdown }));
      setNotice(result.notice || "A complete README has been generated. Review the URLs before submission.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The README could not be generated.");
    } finally {
      setLoading(null);
    }
  }

  function resetProject() {
    const confirmed = window.confirm("Reset the project, task progress, audit, and README?");
    if (!confirmed) return;
    localStorage.removeItem(PROJECT_KEY);
    localStorage.removeItem(AUDIT_KEY);
    setProject(initialProject);
    setAuditInput(initialAuditInput);
    setActiveTab("analyze");
    setNotice("Workspace reset.");
    setError("");
  }

  async function copyReadme() {
    if (!project.readme) return;
    await navigator.clipboard.writeText(project.readme);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function openTab(tab: Tab) {
    setActiveTab(tab);
    setMobileNav(false);
    setError("");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => openTab("analyze")} aria-label="DeadlinePilot AI home">
            <span className="brand-mark"><Icon name="spark" size={23} /></span>
            <span>
              <strong>DeadlinePilot</strong>
              <small>AI project command center</small>
            </span>
          </button>

          <nav className={`main-nav ${mobileNav ? "is-open" : ""}`} aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={activeTab === item.id ? "active" : ""}
                onClick={() => openTab(item.id)}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
                {item.id === "dashboard" && totalTasks > 0 && <span className="nav-count">{progress}%</span>}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button className="icon-button reset-button" onClick={resetProject} title="Reset workspace">
              <Icon name="trash" size={18} />
              <span>Reset</span>
            </button>
            <button className="icon-button mobile-menu" onClick={() => setMobileNav((value) => !value)} aria-label="Toggle menu">
              <Icon name="menu" size={21} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-strip">
          <div className="hero-content">
            <div>
              <span className="eyebrow"><span className="pulse-dot" /> Built for real deadlines</span>
              <h1>Turn a long brief into a project you can actually ship.</h1>
              <p>Analyze requirements, build a focused plan, track completion, audit the submission, and generate the final README.</p>
            </div>
            <div className="hero-proof">
              <div><strong>4</strong><span>connected stages</span></div>
              <div><strong>1</strong><span>clear submission</span></div>
              <div><strong>0</strong><span>accounts required</span></div>
            </div>
          </div>
        </section>

        <div className="workspace">
          {(notice || error) && (
            <div className={`toast-banner ${error ? "error" : "success"}`} role="status">
              <Icon name={error ? "alert" : "check"} size={19} />
              <span>{error || notice}</span>
              <button onClick={() => { setNotice(""); setError(""); }} aria-label="Dismiss">×</button>
            </div>
          )}

          {activeTab === "analyze" && (
            <section className="view-section analyze-view">
              <div className="section-heading">
                <div>
                  <span className="step-label">Stage 1 of 4</span>
                  <h2>Analyze your project brief</h2>
                  <p>Give DeadlinePilot the original instructions. It will extract only supported requirements and build a realistic MVP plan.</p>
                </div>
                <button className="secondary-button" type="button" onClick={loadSample}>Load sample brief</button>
              </div>

              <div className="analyze-grid">
                <form className="panel main-form" onSubmit={analyzeProject}>
                  <div className="form-row two-columns">
                    <label>
                      <span>Project name</span>
                      <input
                        value={project.input.projectName}
                        onChange={(event) => updateInput("projectName", event.target.value)}
                        placeholder="e.g., DeadlinePilot AI"
                        maxLength={80}
                      />
                    </label>
                    <label>
                      <span>Deadline</span>
                      <input
                        type="date"
                        value={project.input.deadline}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(event) => updateInput("deadline", event.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    <span>Assignment or project brief <b>{project.input.brief.length.toLocaleString()} characters</b></span>
                    <textarea
                      className="brief-area"
                      value={project.input.brief}
                      onChange={(event) => updateInput("brief", event.target.value)}
                      placeholder="Paste the complete assignment, client brief, hackathon rules, or capstone requirements here..."
                      maxLength={18000}
                      required
                    />
                  </label>

                  <div className="form-row two-columns">
                    <label>
                      <span>Experience level</span>
                      <select
                        value={project.input.experience}
                        onChange={(event) => updateInput("experience", event.target.value as ProjectInput["experience"])}
                      >
                        <option value="beginner">Beginner — guide me carefully</option>
                        <option value="intermediate">Intermediate — balanced plan</option>
                        <option value="advanced">Advanced — move quickly</option>
                      </select>
                    </label>
                    <label>
                      <span>Available hours per day</span>
                      <div className="range-wrap">
                        <input
                          type="range"
                          min="1"
                          max="14"
                          value={project.input.hoursPerDay}
                          onChange={(event) => updateInput("hoursPerDay", Number(event.target.value))}
                        />
                        <output>{project.input.hoursPerDay}h</output>
                      </div>
                    </label>
                  </div>

                  <button className="primary-button large" type="submit" disabled={loading === "analyze"}>
                    {loading === "analyze" ? <span className="spinner" /> : <Icon name="spark" size={19} />}
                    {loading === "analyze" ? "Analyzing the brief..." : "Build my execution plan"}
                    {loading !== "analyze" && <Icon name="arrow" size={18} />}
                  </button>
                  <p className="security-note">Your API key stays in the server route. Project progress is saved only in this browser.</p>
                </form>

                <aside className="side-stack">
                  <div className="panel guide-card">
                    <span className="card-icon"><Icon name="target" size={22} /></span>
                    <h3>What you receive</h3>
                    <ul className="clean-list">
                      <li><Icon name="check" size={16} /> Mandatory requirements</li>
                      <li><Icon name="check" size={16} /> Smallest complete MVP</li>
                      <li><Icon name="check" size={16} /> Prioritized task checklist</li>
                      <li><Icon name="check" size={16} /> Deadline-aware schedule</li>
                      <li><Icon name="check" size={16} /> Risks and success criteria</li>
                    </ul>
                  </div>

                  <div className="panel strict-card">
                    <div className="mini-header"><Icon name="audit" size={18} /><span>Strict mode</span></div>
                    <p>The AI is instructed not to invent requirements or encourage unnecessary features. It prioritizes a working, deployable submission.</p>
                  </div>

                  <div className="mini-flow">
                    {navItems.map((item, index) => (
                      <div key={item.id} className={activeTab === item.id ? "current" : ""}>
                        <span>{index + 1}</span>
                        <p><strong>{item.label}</strong><small>{["Understand the brief", "Complete the work", "Catch missing items", "Present the project"][index]}</small></p>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            </section>
          )}

          {activeTab === "dashboard" && (
            <section className="view-section dashboard-view">
              {!project.plan ? (
                <EmptyState
                  icon="dashboard"
                  title="Your project dashboard is waiting"
                  text="Analyze a project brief first. DeadlinePilot will turn it into tasks, a schedule, risks, and measurable success criteria."
                  action="Analyze a brief"
                  onAction={() => openTab("analyze")}
                />
              ) : (
                <>
                  <div className="project-title-row">
                    <div>
                      <span className="step-label">Stage 2 of 4</span>
                      <div className="title-with-badge">
                        <h2>{project.plan.appName}</h2>
                        <span className={`source-badge ${project.plan.generatedBy}`}>
                          <Icon name="spark" size={14} /> {project.plan.generatedBy === "gemini" ? "Gemini analysis" : "Built-in analysis"}
                        </span>
                      </div>
                      <p>{project.plan.oneLiner}</p>
                    </div>
                    <div className="title-actions">
                      <button className="secondary-button" onClick={() => downloadText("deadlinepilot-plan.json", JSON.stringify(project, null, 2), "application/json")}>
                        <Icon name="download" size={17} /> Export plan
                      </button>
                      <button className="primary-button compact" onClick={() => openTab("audit")}>Audit submission <Icon name="arrow" size={17} /></button>
                    </div>
                  </div>

                  <div className="metric-grid">
                    <MetricCard label="Overall progress" value={`${progress}%`} detail={`${completedTasks} of ${totalTasks} tasks complete`} icon="target" progress={progress} />
                    <MetricCard label="Time remaining" value={formatHours(remainingHours)} detail={`${formatHours(totalHours)} total estimate`} icon="clock" />
                    <MetricCard label="Critical tasks" value={String(criticalRemaining)} detail={criticalRemaining ? "must-do items remaining" : "all critical work complete"} icon="alert" tone={criticalRemaining ? "warning" : "success"} />
                    <MetricCard label="Deadline" value={project.input.deadline ? new Date(`${project.input.deadline}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Open"} detail={`${project.input.hoursPerDay} available hours/day`} icon="file" />
                  </div>

                  <div className="dashboard-grid">
                    <div className="panel task-panel">
                      <div className="panel-heading">
                        <div><h3>Execution checklist</h3><p>Complete the must-do tasks before optional polish.</p></div>
                        <span className="completion-pill">{completedTasks}/{totalTasks}</span>
                      </div>
                      <div className="progress-track wide"><span style={{ width: `${progress}%` }} /></div>
                      <div className="task-list">
                        {project.plan.tasks.map((task) => (
                          <button key={task.id} className={`task-row ${task.completed ? "done" : ""}`} onClick={() => toggleTask(task.id)}>
                            <span className="custom-check">{task.completed && <Icon name="check" size={15} />}</span>
                            <span className="task-copy">
                              <span className="task-topline">
                                <strong>{task.title}</strong>
                                <span className={`priority ${task.priority}`}>{priorityLabel(task.priority)}</span>
                              </span>
                              <small>{task.description}</small>
                              <span className="task-meta"><b>{task.category}</b><i>•</i>{formatHours(task.estimatedHours)}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="right-column">
                      <div className="panel problem-card">
                        <div className="panel-heading"><div><h3>Problem and users</h3><p>The purpose behind the build.</p></div></div>
                        <div className="info-block"><span>Problem</span><p>{project.plan.problem}</p></div>
                        <div className="info-block"><span>Target users</span><p>{project.plan.targetUsers}</p></div>
                      </div>

                      <div className="panel ai-card">
                        <div className="ai-heading"><span className="card-icon"><Icon name="spark" size={20} /></span><div><small>Meaningful AI feature</small><h3>{project.plan.aiFeature.name}</h3></div></div>
                        <p>{project.plan.aiFeature.purpose}</p>
                        <div className="prompt-box"><span>Prompt strategy</span>{project.plan.aiFeature.systemPromptSummary}</div>
                      </div>
                    </div>
                  </div>

                  <div className="lower-grid">
                    <div className="panel schedule-panel">
                      <div className="panel-heading"><div><h3>Suggested schedule</h3><p>Work in sequence and protect deployment time.</p></div></div>
                      <div className="timeline">
                        {project.plan.schedule.map((block, index) => (
                          <div className="timeline-item" key={`${block.label}-${index}`}>
                            <span className="timeline-dot">{index + 1}</span>
                            <div>
                              <div className="timeline-title"><strong>{block.label}: {block.focus}</strong><span>{formatHours(block.hours)}</span></div>
                              <p>{block.tasks.join(" · ") || "Complete the planned tasks for this phase."}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="panel requirements-panel">
                      <div className="panel-heading"><div><h3>Mandatory requirements</h3><p>Directly extracted from the brief.</p></div></div>
                      <ul className="number-list">
                        {project.plan.mandatoryRequirements.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="lower-grid equal">
                    <ListPanel title="Recommended features" subtitle="Useful, but keep the MVP focused." items={project.plan.recommendedFeatures} icon="check" />
                    <ListPanel title="Risks to control" subtitle="Common ways projects lose marks." items={project.plan.risks} icon="alert" warning />
                    <ListPanel title="Success criteria" subtitle="Evidence that the project is complete." items={project.plan.successCriteria} icon="target" />
                  </div>
                </>
              )}
            </section>
          )}

          {activeTab === "audit" && (
            <section className="view-section audit-view">
              <div className="section-heading">
                <div>
                  <span className="step-label">Stage 3 of 4</span>
                  <h2>Run a submission-readiness audit</h2>
                  <p>Provide the evidence a grader will see. DeadlinePilot identifies critical gaps before the final submission.</p>
                </div>
              </div>

              <div className="audit-grid">
                <form className="panel main-form audit-form" onSubmit={runAudit}>
                  <div className="form-row two-columns">
                    <label>
                      <span>Public GitHub repository URL</span>
                      <div className="input-with-icon"><Icon name="github" size={18} /><input type="url" value={auditInput.repositoryUrl} onChange={(event) => setAuditInput((current) => ({ ...current, repositoryUrl: event.target.value }))} placeholder="https://github.com/username/repository" /></div>
                    </label>
                    <label>
                      <span>Live deployed URL</span>
                      <div className="input-with-icon"><Icon name="external" size={18} /><input type="url" value={auditInput.liveUrl} onChange={(event) => setAuditInput((current) => ({ ...current, liveUrl: event.target.value }))} placeholder="https://your-app.vercel.app" /></div>
                    </label>
                  </div>

                  <div className="form-row audit-small-row">
                    <label>
                      <span>Number of screenshots</span>
                      <input type="number" min="0" max="20" value={auditInput.screenshotsCount} onChange={(event) => setAuditInput((current) => ({ ...current, screenshotsCount: Number(event.target.value) }))} />
                    </label>
                    <div className="audit-hint"><Icon name="file" size={18} /><p><strong>Minimum expected: 3</strong><span>Show different stages of the working app.</span></p></div>
                  </div>

                  <label>
                    <span>Features you claim are working</span>
                    <textarea value={auditInput.claimedFeatures} onChange={(event) => setAuditInput((current) => ({ ...current, claimedFeatures: event.target.value }))} placeholder="List one working feature per line..." />
                  </label>

                  <label>
                    <span>README content</span>
                    <textarea className="readme-input" value={auditInput.readme || project.readme} onChange={(event) => setAuditInput((current) => ({ ...current, readme: event.target.value }))} placeholder="Paste your current README here, or generate it in the README stage..." />
                  </label>

                  <button className="primary-button large" type="submit" disabled={loading === "audit"}>
                    {loading === "audit" ? <span className="spinner" /> : <Icon name="audit" size={19} />}
                    {loading === "audit" ? "Auditing submission..." : "Run strict audit"}
                    {loading !== "audit" && <Icon name="arrow" size={18} />}
                  </button>
                </form>

                <aside className="audit-result-column">
                  {!project.audit ? (
                    <div className="panel audit-placeholder">
                      <div className="radar"><span /><span /><span /><Icon name="audit" size={32} /></div>
                      <h3>No audit run yet</h3>
                      <p>Complete the evidence form to receive a readiness score, critical issues, improvements, and a final pre-submission checklist.</p>
                      <div className="audit-standards">
                        <span>Public repo</span><span>Live URL</span><span>AI feature</span><span>Strong README</span><span>3+ screenshots</span><span>No secrets</span>
                      </div>
                    </div>
                  ) : (
                    <AuditResults result={project.audit} onReadme={() => openTab("readme")} />
                  )}
                </aside>
              </div>
            </section>
          )}

          {activeTab === "readme" && (
            <section className="view-section readme-view">
              <div className="section-heading readme-heading">
                <div>
                  <span className="step-label">Stage 4 of 4</span>
                  <h2>Generate the project report</h2>
                  <p>Create a complete README that explains the problem, app, AI prompt, technology, screenshots, setup, and deployment.</p>
                </div>
                <div className="title-actions">
                  <button className="secondary-button" onClick={generateReadme} disabled={loading === "readme"}>
                    {loading === "readme" ? <span className="spinner dark" /> : <Icon name="spark" size={17} />}
                    {project.readme ? "Regenerate" : "Generate README"}
                  </button>
                  <button className="secondary-button" onClick={copyReadme} disabled={!project.readme}><Icon name={copied ? "check" : "copy"} size={17} />{copied ? "Copied" : "Copy"}</button>
                  <button className="primary-button compact" onClick={() => project.readme && downloadText("README.md", project.readme, "text/markdown")} disabled={!project.readme}><Icon name="download" size={17} />Download .md</button>
                </div>
              </div>

              {!project.plan ? (
                <EmptyState icon="file" title="Analyze a project before writing its README" text="The report is generated from the project problem, features, AI strategy, requirements, and suggested stack." action="Analyze a brief" onAction={() => openTab("analyze")} />
              ) : (
                <div className="readme-grid">
                  <div className="panel readme-editor">
                    <div className="editor-toolbar">
                      <div><span className="dot red"/><span className="dot yellow"/><span className="dot green"/></div>
                      <strong>README.md</strong>
                      <span>{project.readme ? `${project.readme.split(/\s+/).filter(Boolean).length.toLocaleString()} words` : "Not generated"}</span>
                    </div>
                    <textarea
                      value={project.readme}
                      onChange={(event) => {
                        const readme = event.target.value;
                        setProject((current) => ({ ...current, readme }));
                        setAuditInput((current) => ({ ...current, readme }));
                      }}
                      placeholder="Click “Generate README” to create the complete project report. You can edit every line here before downloading it."
                      spellCheck={false}
                    />
                  </div>

                  <aside className="readme-side">
                    <div className="panel checklist-card">
                      <div className="panel-heading"><div><h3>Required README sections</h3><p>Everything the grader asked for.</p></div></div>
                      {[
                        ["App name and real problem", /#\s|problem/i],
                        ["Clickable live URL", /live.{0,20}https?:\/\//i],
                        ["Complete features list", /## Features/i],
                        ["AI feature and prompt", /AI Feature|prompt strategy|system prompt/i],
                        ["Tools, services, and model", /Technolog|Tools|Gemini/i],
                        ["Three or more screenshots", /screenshots[\s\S]*(\.png|\.jpg)/i],
                        ["Local setup instructions", /Run Locally|Installation|npm install/i],
                      ].map(([label, pattern]) => {
                        const complete = (pattern as RegExp).test(project.readme);
                        return <div className={`readme-check ${complete ? "complete" : ""}`} key={String(label)}><span>{complete && <Icon name="check" size={14} />}</span>{String(label)}</div>;
                      })}
                    </div>

                    <div className="panel url-card">
                      <h3>Final links</h3>
                      <label><span>Repository URL</span><input value={auditInput.repositoryUrl} onChange={(event) => setAuditInput((current) => ({ ...current, repositoryUrl: event.target.value }))} placeholder="Add after pushing to GitHub" /></label>
                      <label><span>Live URL</span><input value={auditInput.liveUrl} onChange={(event) => setAuditInput((current) => ({ ...current, liveUrl: event.target.value }))} placeholder="Add after Vercel deployment" /></label>
                      <p>Regenerate the README after entering the final links so they appear in the downloaded file.</p>
                    </div>

                    <div className="panel ship-card">
                      <span className="card-icon"><Icon name="github" size={20} /></span>
                      <div><h3>Ready to submit?</h3><p>Open both links in an incognito window. Then submit only the public GitHub repository URL.</p></div>
                    </div>
                  </aside>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <footer>
        <div><span className="brand-mark small"><Icon name="spark" size={16} /></span><strong>DeadlinePilot AI</strong><span>From assignment brief to shipped project.</span></div>
        <span>Progress stays in your browser · API key stays server-side</span>
      </footer>
    </div>
  );
}

function MetricCard({ label, value, detail, icon, progress, tone }: { label: string; value: string; detail: string; icon: string; progress?: number; tone?: "warning" | "success" }) {
  return (
    <div className={`panel metric-card ${tone || ""}`}>
      <span className="metric-icon"><Icon name={icon} size={20} /></span>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      {typeof progress === "number" && <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>}
    </div>
  );
}

function ListPanel({ title, subtitle, items, icon, warning = false }: { title: string; subtitle: string; items: string[]; icon: string; warning?: boolean }) {
  return (
    <div className={`panel list-panel ${warning ? "warning" : ""}`}>
      <div className="panel-heading"><div><h3>{title}</h3><p>{subtitle}</p></div></div>
      <ul className="clean-list compact-list">
        {items.map((item) => <li key={item}><Icon name={icon} size={15} />{item}</li>)}
      </ul>
    </div>
  );
}

function AuditResults({ result, onReadme }: { result: AuditResult; onReadme: () => void }) {
  const scoreClass = result.score >= 85 ? "great" : result.score >= 65 ? "close" : "weak";
  return (
    <div className="audit-result-stack">
      <div className={`panel score-card ${scoreClass}`}>
        <div className="score-ring" style={{ "--score": `${result.score * 3.6}deg` } as React.CSSProperties}><span><strong>{result.score}</strong><small>/100</small></span></div>
        <div><span className="source-badge"><Icon name="spark" size={13} />{result.generatedBy === "gemini" ? "Gemini audit" : "Built-in audit"}</span><h3>{result.verdict}</h3><p>{result.criticalIssues.length ? `${result.criticalIssues.length} critical issue${result.criticalIssues.length === 1 ? "" : "s"} should be fixed before submission.` : "No critical issues were identified from the supplied evidence."}</p></div>
      </div>

      {result.criticalIssues.length > 0 && <AuditList title="Critical issues" items={result.criticalIssues} icon="alert" kind="critical" />}
      {result.passedChecks.length > 0 && <AuditList title="Checks passed" items={result.passedChecks} icon="check" kind="passed" />}
      {result.improvements.length > 0 && <AuditList title="Recommended improvements" items={result.improvements} icon="target" kind="improve" />}
      <AuditList title="Final pre-submission checklist" items={result.finalChecklist} icon="check" kind="final" />
      <button className="primary-button large" onClick={onReadme}>Improve the README <Icon name="arrow" size={18} /></button>
    </div>
  );
}

function AuditList({ title, items, icon, kind }: { title: string; items: string[]; icon: string; kind: string }) {
  return (
    <div className={`panel audit-list-card ${kind}`}>
      <h3>{title}<span>{items.length}</span></h3>
      <ul>{items.map((item) => <li key={item}><span><Icon name={icon} size={15} /></span>{item}</li>)}</ul>
    </div>
  );
}

function EmptyState({ icon, title, text, action, onAction }: { icon: string; title: string; text: string; action: string; onAction: () => void }) {
  return (
    <div className="panel empty-state">
      <span className="empty-icon"><Icon name={icon} size={32} /></span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary-button" onClick={onAction}>{action}<Icon name="arrow" size={17} /></button>
    </div>
  );
}
