import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { scanForRoadmaps } from "./scanner";

interface SourcesConfig {
  scanPaths?: string[];
}

interface ContextWorkUnit {
  filename: string;
  title: string;
  status: string;
  priority: string;
  effort?: string;
  tags: string[];
  created?: string;
  updated: string;
  description: string;
  body: string;
}

interface ContextProject {
  path: string;
  name: string;
  title: string;
  goal: string;
  workUnits: ContextWorkUnit[];
}

interface ContextBundle {
  generatedAt: string;
  scanPaths: string[];
  projectCount: number;
  workUnitCount: number;
  projects: ContextProject[];
}

const DEFAULT_SCAN_PATHS = ["~/projects", "~/projects/games"];
const DEFAULT_OUTPUT_PATH = ".logs/roadmap-context.json";
const DEFAULT_SOURCES_PATH = "roadmap-sources.json";

const args = process.argv.slice(2);
const positionalScanPaths: string[] = [];
let outputPath = DEFAULT_OUTPUT_PATH;
let sourcesPath = DEFAULT_SOURCES_PATH;
let includeFullBody = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (!arg) {
    continue;
  }

  if (arg === "--out" || arg === "-o") {
    const value = args[i + 1];
    if (value) {
      outputPath = value;
      i++;
    }
  } else if (arg === "--sources" || arg === "-s") {
    const value = args[i + 1];
    if (value) {
      sourcesPath = value;
      i++;
    }
  } else if (arg === "--full-body") {
    includeFullBody = true;
  } else {
    positionalScanPaths.push(arg);
  }
}

const scanPaths = await resolveScanPaths(positionalScanPaths, sourcesPath);
const roadmaps = await scanForRoadmaps(scanPaths);

roadmaps.sort((a, b) => a.name.localeCompare(b.name));
for (const project of roadmaps) {
  project.workUnits.sort((a, b) => a.filename.localeCompare(b.filename));
}

const projects: ContextProject[] = roadmaps.map((project) => ({
  path: project.path,
  name: project.name,
  title: project.title,
  goal: project.goal,
  workUnits: project.workUnits.map((unit) => ({
    filename: unit.filename,
    title: unit.title,
    status: unit.status,
    priority: unit.priority,
    effort: unit.effort,
    tags: unit.tags,
    created: unit.created,
    updated: unit.updated,
    description: unit.description,
    body: includeFullBody ? unit.body : summarize(unit.body),
  })),
}));

const workUnitCount = projects.reduce((count, project) => count + project.workUnits.length, 0);

const bundle: ContextBundle = {
  generatedAt: new Date().toISOString(),
  scanPaths,
  projectCount: projects.length,
  workUnitCount,
  projects,
};

const outputFile = resolve(outputPath);
await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");

console.log(`Wrote: ${outputFile}`);
console.log(`Projects: ${bundle.projectCount}`);
console.log(`Work units: ${bundle.workUnitCount}`);

async function resolveScanPaths(positional: string[], sourceFilePath: string): Promise<string[]> {
  const trimmedPositional = positional.map((path) => path.trim()).filter(Boolean);
  if (trimmedPositional.length > 0) {
    return unique(trimmedPositional);
  }

  const resolvedSourcesPath = resolve(sourceFilePath);
  if (await fileExists(resolvedSourcesPath)) {
    const content = await Bun.file(resolvedSourcesPath).text();
    const parsed = JSON.parse(content) as SourcesConfig;
    const configured = Array.isArray(parsed.scanPaths)
      ? parsed.scanPaths.filter((path): path is string => typeof path === "string")
      : [];
    if (configured.length > 0) {
      return unique(configured.map((path) => path.trim()).filter(Boolean));
    }
  }

  return DEFAULT_SCAN_PATHS;
}

function summarize(input: string): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  const maxChars = 700;
  return normalized.length > maxChars ? `${normalized.slice(0, maxChars)}...` : normalized;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
