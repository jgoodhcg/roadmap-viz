import { scanForRoadmaps, type ProjectRoadmap, type WorkUnit } from "./scanner";

const DEFAULT_SCAN_PATHS = ["~/projects", "~/projects/games"];

export async function startServer(scanPaths: string[] = DEFAULT_SCAN_PATHS, preferredPort = 3000) {
  let port = preferredPort;
  const maxRetries = 10;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const server = Bun.serve({
        port: port,
        async fetch(req) {
          const url = new URL(req.url);

          if (url.pathname === "/") {
            const roadmaps = await scanForRoadmaps(scanPaths);
            const html = renderPage(roadmaps);
            return new Response(html, {
              headers: { "Content-Type": "text/html" },
            });
          }

          return new Response("Not Found", { status: 404 });
        },
      });

      console.log(`🚀 Roadmap Viz server running at: http://localhost:${server.port}`);
      console.log(`Scanning in: ${scanPaths.join(", ")}`);
      return server;
    } catch (err: any) {
      if (err.code === "EADDRINUSE" || err.message.includes("EADDRINUSE")) {
        console.warn(`Port ${port} is in use, trying ${port + 1}...`);
        port++;
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Could not find an open port after ${maxRetries} attempts.`);
}

function renderPage(roadmaps: ProjectRoadmap[]): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roadmap Viz</title>
    <style>
        :root {
            --foreground: #0f172a;
            --secondary: #475569;
            --muted: #94a3b8;
            --faint: #e2e8f0;
            --border: #cbd5e1;
            --accent: #2563eb;
            --accent-fg: #ffffff;
            --bg-app: #f8fafc;
            --bg-panel: #ffffff;
            --radius: 4px;
            --space-1: 4px;
            --space-2: 8px;
            --space-3: 12px;
            --space-4: 16px;
            --space-6: 24px;
        }

        body {
            font-family: system-ui, -apple-system, sans-serif;
            background-color: var(--bg-app);
            color: var(--foreground);
            margin: 0;
            padding: var(--space-4);
            line-height: 1.5;
        }

        header {
            margin-bottom: var(--space-6);
            border-bottom: 1px solid var(--border);
            padding-bottom: var(--space-4);
        }

        h1 { font-size: 20px; font-weight: 600; margin: 0; }
        .subtitle { color: var(--secondary); font-size: 13px; }

        .project-section {
            margin-bottom: 48px;
        }

        .project-header {
            margin-bottom: var(--space-4);
        }

        .project-title { font-size: 16px; font-weight: 600; margin-bottom: 2px; }
        .project-goal { font-size: 13px; color: var(--secondary); }

        .kanban-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--space-4);
            align-items: start;
        }

        .column {
            background: var(--faint);
            border-radius: var(--radius);
            padding: var(--space-2);
            min-height: 200px;
        }

        .column-header {
            font-size: 12px;
            font-weight: 600;
            color: var(--secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: var(--space-2);
            padding: 0 var(--space-1);
        }

        .card {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: var(--space-2) var(--space-3);
            margin-bottom: var(--space-2);
            font-size: 13px;
        }

        .card-title { font-weight: 500; margin-bottom: 2px; }
        .card-desc { color: var(--secondary); font-size: 12px; }
        
        .tag {
            display: inline-block;
            font-size: 10px;
            background: var(--faint);
            color: var(--secondary);
            padding: 1px 6px;
            border-radius: 10px;
            margin-top: var(--space-1);
            margin-right: 4px;
        }

        .priority-high { border-left: 3px solid #ef4444; }
        .priority-medium { border-left: 3px solid #f59e0b; }
        .priority-low { border-left: 3px solid #10b981; }
    </style>
</head>
<body>

    <header>
        <h1>Roadmap Explorer</h1>
        <div class="subtitle">Visualizing agent progress across projects</div>
    </header>

    ${roadmaps.map(renderProject).join("")}

</body>
</html>
  `;
}

function renderProject(project: ProjectRoadmap): string {
  const backlog = project.workUnits.filter(u => u.status === 'idea' || u.status === 'planned');
  const inProgress = project.workUnits.filter(u => u.status === 'active' || u.status === 'paused');
  const done = project.workUnits.filter(u => u.status === 'done');

  return `
    <section class="project-section">
        <div class="project-header">
            <div class="project-title">${escapeHtml(project.title)}</div>
            <div class="project-goal">${escapeHtml(project.goal)}</div>
        </div>
        
        <div class="kanban-grid">
            <div class="column">
                <div class="column-header">Backlog</div>
                ${backlog.map(renderCard).join("")}
            </div>
            <div class="column">
                <div class="column-header">In Progress</div>
                ${inProgress.map(renderCard).join("")}
            </div>
            <div class="column">
                <div class="column-header">Done</div>
                ${done.map(renderCard).join("")}
            </div>
        </div>
    </section>
  `;
}

function renderCard(unit: WorkUnit): string {
  const tagsHtml = unit.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  return `
    <div class="card priority-${unit.priority}">
        <div class="card-title">${escapeHtml(unit.title)}</div>
        <div class="card-desc">${escapeHtml(unit.description)}</div>
        <div>${tagsHtml}</div>
    </div>
  `;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}