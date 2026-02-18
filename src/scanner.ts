import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { homedir } from "node:os";

export interface WorkUnit {
  filename: string;
  title: string;
  status: "draft" | "ready" | "active" | "done" | "dropped" | "idea" | "planned" | "paused" | "queued" | "focus";
  description: string;
  priority: "high" | "medium" | "low";
  effort?: string;
  tags: string[];
  updated: string;
  created?: string;
  body: string;
}

export interface ProjectRoadmap {
  path: string;
  name: string;
  title: string;
  goal: string;
  workUnits: WorkUnit[];
}

export async function scanForRoadmaps(scanPaths: string[]): Promise<ProjectRoadmap[]> {
  const roadmaps: ProjectRoadmap[] = [];
  const discoveredProjects = new Set<string>();

  for (const scanPath of scanPaths) {
    const resolvedPath = normalizePath(scanPath);

    if (await isRoadmapProject(resolvedPath)) {
      discoveredProjects.add(resolvedPath);
    }

    try {
      const entries = await readdir(resolvedPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectPath = join(resolvedPath, entry.name);
          if (await isRoadmapProject(projectPath)) {
            discoveredProjects.add(projectPath);
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning path ${resolvedPath}:`, err);
    }
  }

  for (const projectPath of discoveredProjects) {
    try {
      const roadmap = await parseProjectRoadmap(projectPath);
      roadmaps.push(roadmap);
    } catch (err) {
      console.error(`Error parsing roadmap at ${projectPath}:`, err);
    }
  }

  return roadmaps;
}

async function isRoadmapProject(projectPath: string): Promise<boolean> {
  try {
    const indexStat = await stat(join(projectPath, "roadmap", "index.md"));
    return indexStat.isFile();
  } catch {
    return false;
  }
}

function normalizePath(path: string): string {
  return path.startsWith("~")
    ? join(homedir(), path.slice(1))
    : resolve(path);
}

async function parseProjectRoadmap(projectPath: string): Promise<ProjectRoadmap> {
  const indexPath = join(projectPath, "roadmap", "index.md");
  const indexContent = await Bun.file(indexPath).text();
  const { data: indexData } = matter(indexContent);

  const roadmapDir = join(projectPath, "roadmap");
  const archivedDir = join(roadmapDir, "archived");
  
  const workUnits: WorkUnit[] = [];

  // Helper to process files in a directory
  const processDir = async (dir: string) => {
    try {
      const files = await readdir(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".md") && file.name !== "index.md" && !file.name.startsWith("_")) {
          const content = await Bun.file(join(dir, file.name)).text();
          const { data, content: body } = matter(content);
          
          workUnits.push({
            filename: file.name,
            title: data.title || file.name,
            status: data.status || "draft",
            description: data.description || "",
            priority: data.priority || "medium",
            effort: data.effort,
            tags: data.tags || [],
            updated: data.updated || "",
            created: data.created || "",
            body: body
          });
        }
      }
    } catch (e) {
      // Directory might not exist (e.g. archived), just ignore
    }
  };

  await processDir(roadmapDir);
  await processDir(archivedDir);

  return {
    path: projectPath,
    name: entryName(projectPath),
    title: indexData.title || entryName(projectPath),
    goal: indexData.goal || "",
    workUnits
  };
}

function entryName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}
