import { scanForRoadmaps, type ProjectRoadmap, type WorkUnit } from "./scanner";
import { marked } from "marked";

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

          // 1. Main Page
          if (url.pathname === "/") {
            const roadmaps = await scanForRoadmaps(scanPaths);
            const html = renderPage(roadmaps);
            return new Response(html, {
              headers: { "Content-Type": "text/html" },
            });
          }

          // 2. HTMX Fragment: Work Unit Detail
          if (url.pathname === "/api/unit") {
            const projectName = url.searchParams.get("project");
            const filename = url.searchParams.get("file");
            
            if (projectName && filename) {
              const roadmaps = await scanForRoadmaps(scanPaths); // In prod, cache this
              const project = roadmaps.find(p => p.name === projectName);
              const unit = project?.workUnits.find(u => u.filename === filename);
              
              if (unit) {
                return new Response(renderUnitDetail(unit), {
                    headers: { "Content-Type": "text/html" }
                });
              }
            }
            return new Response("Not Found", { status: 404 });
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

function renderUnitDetail(unit: WorkUnit): string {
    const fields = [
        { label: 'Status', value: unit.status, capitalize: true },
        { label: 'Priority', value: unit.priority, capitalize: true },
        { label: 'Effort', value: unit.effort || '-' },
        { label: 'Created', value: unit.created || '-' },
        { label: 'Updated', value: unit.updated || '-' },
        { label: 'Tags', value: unit.tags.join(', ') || '-' }
    ];

    const metaHtml = fields.map(f => `
        <div class="meta-item">
            <div class="meta-label">${escapeHtml(f.label)}</div>
            <div class="meta-value" ${f.capitalize ? 'style="text-transform:capitalize"' : ''}>${escapeHtml(f.value)}</div>
        </div>
    `).join('');

    return `
        <div class="modal-header">
            <div style="flex:1">
                <div class="modal-title">${escapeHtml(unit.title)}</div>
                <div class="modal-meta-grid">
                    ${metaHtml}
                </div>
            </div>
            <button class="close-btn" onclick="closeModal()">×</button>
        </div>
        <div class="modal-body">
            ${marked.parse(unit.body || "")}
        </div>
    `;
}

function renderPage(roadmaps: ProjectRoadmap[]): string {
  roadmaps.sort((a, b) => a.name.localeCompare(b.name));

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roadmap Viz</title>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <style>
        :root {
            /* Palette: Slate */
            --foreground: #0f172a; --secondary: #475569; --muted: #94a3b8; --faint: #f1f5f9;
            --border: #cbd5e1; --accent: #2563eb; --accent-fg: #ffffff;
            --bg-app: #f8fafc; --bg-panel: #ffffff;
            --radius-sm: 2px; --radius-md: 4px; --radius-lg: 6px;
            --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px;
            --col-backlog: #f1f5f9; --col-queue: #e2e8f0; --col-focus: #eff6ff; --col-done: #f0fdf4;
        }

        body {
            font-family: system-ui, -apple-system, sans-serif;
            background-color: var(--bg-app); color: var(--foreground);
            margin: 0; padding: 0; line-height: 1.4; height: 100vh;
            display: flex; flex-direction: column; overflow: hidden;
            font-size: 13px;
        }

        /* --- Header & Tabs --- */
        .app-header {
            background: var(--bg-panel); border-bottom: 1px solid var(--border);
            padding: var(--space-2) var(--space-4); display: flex; align-items: center; justify-content: space-between;
            height: 48px; box-sizing: border-box; flex-shrink: 0;
        }
        .header-left { display: flex; align-items: baseline; gap: var(--space-3); }
        h1 { font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.02em; }
        .subtitle { color: var(--secondary); font-size: 12px; }

        .toggle-control { display: flex; align-items: center; gap: var(--space-2); font-size: 12px; color: var(--secondary); cursor: pointer; user-select: none; }
        .toggle-switch { position: relative; width: 32px; height: 18px; background: var(--border); border-radius: 99px; transition: background 0.2s; }
        .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; background: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        input[type="checkbox"]:checked + .toggle-switch { background: var(--accent); }
        input[type="checkbox"]:checked + .toggle-switch::after { transform: translateX(14px); }
        input[type="checkbox"] { display: none; }

        .tabs-nav {
            background: var(--bg-panel); border-bottom: 1px solid var(--border);
            padding: 0 var(--space-4); display: flex; gap: var(--space-4); overflow-x: auto;
            height: 40px; flex-shrink: 0; white-space: nowrap;
        }
        .tabs-nav::-webkit-scrollbar { height: 0px; background: transparent; }

        .tab-btn {
            background: none; border: none; border-bottom: 2px solid transparent;
            color: var(--secondary); font-size: 12px; font-weight: 500; cursor: pointer;
            padding: 0 var(--space-1); height: 100%; display: flex; align-items: center;
        }
        .tab-btn:hover { color: var(--foreground); }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

        /* --- Main Content --- */
        .main-content { flex: 1; overflow-y: auto; padding: var(--space-4); }
        .project-tab { display: none; }
        .project-tab.active { display: block; }
        .project-meta { margin-bottom: var(--space-4); }
        .project-meta h2 { font-size: 16px; margin: 0 0 2px 0; font-weight: 600; }
        .project-meta p { font-size: 13px; color: var(--secondary); margin: 0; }

        .kanban-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); align-items: start; height: 100%; }
        .column { background: var(--faint); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-2); min-height: 200px; display: flex; flex-direction: column; gap: var(--space-2); }
        .col-focus { background: var(--col-focus); border-color: #bfdbfe; }
        .col-done { background: var(--col-done); border-color: #bbf7d0; opacity: 0.85; }

        .column-header { font-size: 11px; font-weight: 600; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.05em; padding: 0 var(--space-1); display: flex; justify-content: space-between; }
        .col-focus .column-header { color: var(--accent); }
        .col-done .column-header { color: #166534; }

        .card { background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-2); font-size: 12px; cursor: pointer; transition: border-color 0.15s; position: relative; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .card:hover { border-color: var(--accent); z-index: 1; }
        .card-title { font-weight: 600; margin-bottom: 2px; line-height: 1.3; color: var(--foreground); }
        .card-desc { color: var(--secondary); font-size: 11px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0; line-height: 1.4; }
        
        .meta-pills { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-top: 8px; max-height: 100px; opacity: 1; transition: all 0.2s ease; overflow: hidden; }
        body.hide-pills .meta-pills { margin-top: 0; max-height: 0; opacity: 0; }

        .pill { display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; padding: 1px 5px; border-radius: 3px; white-space: nowrap; height: 18px; box-sizing: border-box; }
        .pill-effort { background: var(--foreground); color: var(--bg-panel); font-weight: 600; min-width: 18px; }
        .pill-priority-high { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
        .pill-priority-medium { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
        .pill-priority-low { background: #d1fae5; color: #047857; border: 1px solid #a7f3d0; }
        .pill-tag { background: var(--faint); color: var(--secondary); border: 1px solid var(--border); }

        /* --- Modal --- */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(1px); display: flex; align-items: center; justify-content: center; z-index: 100; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
        .modal-overlay.open { opacity: 1; pointer-events: auto; }
        .modal-content { background: var(--bg-panel); width: 700px; max-width: 90vw; max-height: 85vh; border-radius: var(--radius-lg); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border); }
        
        /* These styles will match the Fragment returned by server */
        .modal-header { padding: var(--space-4); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: start; background: #f8fafc; flex-shrink: 0; }
        .modal-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; line-height: 1.3; }
        .modal-meta-grid { display: flex; flex-wrap: wrap; gap: var(--space-4); font-size: 12px; color: var(--secondary); }
        .meta-item { display: flex; flex-direction: column; gap: 2px; }
        .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 600; }
        .meta-value { font-weight: 500; color: var(--foreground); }
        .close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--muted); padding: 4px; border-radius: 4px; line-height: 1; }
        .close-btn:hover { color: var(--foreground); background: var(--faint); }
        
        .modal-body { padding: var(--space-6); overflow-y: auto; font-size: 13px; line-height: 1.6; }
        .modal-body h1 { font-size: 18px; margin: 1.5em 0 0.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.3em; }
        .modal-body h2 { font-size: 16px; margin: 1.4em 0 0.5em; }
        .modal-body code { background: var(--faint); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em; border: 1px solid var(--border); }
        .modal-body pre { background: #f8fafc; padding: 1em; border-radius: 4px; overflow-x: auto; margin: 1em 0; border: 1px solid var(--border); }
        
        /* Loading State */
        .htmx-indicator { display:none; }
        .htmx-request .htmx-indicator { display:inline; }
    </style>
</head>
<body class="">

    <header class="app-header">
        <div class="header-left">
            <h1>Roadmap Explorer</h1>
            <span class="subtitle">Flight Control</span>
        </div>
        
        <div class="header-controls">
            <label class="toggle-control">
                <span>Details</span>
                <input type="checkbox" id="toggle-details" checked onchange="toggleDetails(this)">
                <div class="toggle-switch"></div>
            </label>
        </div>
    </header>

    <nav class="tabs-nav">
        ${roadmaps.map((p, i) => `
            <button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="switchTab('${i}')">
                ${escapeHtml(p.name)}
            </button>
        `).join('')}
    </nav>

    <div class="main-content">
        ${roadmaps.map((p, i) => renderProjectTab(p, i)).join('')}
    </div>

    <!-- Empty Modal Shell -->
    <div id="modal" class="modal-overlay" onclick="if(event.target === this) closeModal()">
        <div id="modal-container" class="modal-content">
            <!-- Content loaded via HTMX -->
            <div style="padding: 24px; text-align: center; color: var(--secondary);">Loading...</div>
        </div>
    </div>

    <script>
        function switchTab(index) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-btn')[index].classList.add('active');
            document.querySelectorAll('.project-tab').forEach(tab => tab.classList.remove('active'));
            document.getElementById('project-' + index).classList.add('active');
        }

        function toggleDetails(checkbox) {
            if (checkbox.checked) {
                document.body.classList.remove('hide-pills');
            } else {
                document.body.classList.add('hide-pills');
            }
        }

        function closeModal() {
            document.getElementById('modal').classList.remove('open');
            // Reset content after close so it shows loading next time
            setTimeout(() => {
                document.getElementById('modal-container').innerHTML = '<div style="padding: 24px; text-align: center; color: var(--secondary);">Loading...</div>';
            }, 200);
        }
        
        // Listen for HTMX swap to open modal
        document.body.addEventListener('htmx:afterSwap', function(evt) {
            if (evt.detail.target.id === 'modal-container') {
                document.getElementById('modal').classList.add('open');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    </script>
</body>
</html>
  `;
}

function renderProjectTab(project: ProjectRoadmap, index: number): string {
  const backlog = project.workUnits.filter(u =>
    u.status === 'draft' || u.status === 'ready' || u.status === 'idea' || u.status === 'planned'
  );

  const focus = project.workUnits.filter(u =>
    u.status === 'focus' ||
    ((u.status === 'active' || u.status === 'paused') && u.tags.includes('focus'))
  );

  const queue = project.workUnits.filter(u =>
    (u.status === 'active' || u.status === 'paused' || u.status === 'queued') &&
    !u.tags.includes('focus')
  );

  const done = project.workUnits.filter(u => u.status === 'done' || u.status === 'dropped');

  return `
    <div id="project-${index}" class="project-tab ${index === 0 ? 'active' : ''}">
        <div class="project-meta">
            <h2>${escapeHtml(project.title)}</h2>
            <p>${escapeHtml(project.goal)}</p>
        </div>
        
        <div class="kanban-grid">
            <div class="column">
                <div class="column-header"><span>Backlog</span><span style="opacity:0.6">${backlog.length}</span></div>
                ${backlog.map(u => renderCard(u, project.name)).join("")}
            </div>
            <div class="column">
                <div class="column-header"><span>Queue</span><span style="opacity:0.6">${queue.length}</span></div>
                ${queue.map(u => renderCard(u, project.name)).join("")}
            </div>
            <div class="column col-focus">
                <div class="column-header"><span>Current Focus</span><span style="opacity:0.6">${focus.length}</span></div>
                ${focus.map(u => renderCard(u, project.name)).join("")}
            </div>
            <div class="column col-done">
                <div class="column-header"><span>Done</span><span style="opacity:0.6">${done.length}</span></div>
                ${done.map(u => renderCard(u, project.name)).join("")}
            </div>
        </div>
    </div>
  `;
}

function renderCard(unit: WorkUnit, projectName: string): string {
  let pillsHtml = '';
  
  if (unit.effort) pillsHtml += `<span class="pill pill-effort">${escapeHtml(unit.effort)}</span>`;
  pillsHtml += `<span class="pill pill-priority-${unit.priority}">${escapeHtml(unit.priority)}</span>`;
  unit.tags.forEach(t => pillsHtml += `<span class="pill pill-tag">${escapeHtml(t)}</span>`);
  
  // HTMX GET request on click
  const apiUrl = `/api/unit?project=${encodeURIComponent(projectName)}&file=${encodeURIComponent(unit.filename)}`;

  return `
    <div class="card" 
         hx-get="${apiUrl}" 
         hx-target="#modal-container"
         hx-swap="innerHTML">
        <div class="card-title">${escapeHtml(unit.title)}</div>
        ${unit.description ? `<div class="card-desc">${escapeHtml(unit.description)}</div>` : ''}
        <div class="meta-pills">${pillsHtml}</div>
    </div>
  `;
}

function escapeHtml(unsafe: any): string {
  if (unsafe === undefined || unsafe === null) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
