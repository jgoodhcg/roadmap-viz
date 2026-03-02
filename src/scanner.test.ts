import { expect, test, describe } from "bun:test";
import { scanForRoadmaps } from "./scanner";
import { join } from "node:path";

describe("scanner", () => {
  test("scanForRoadmaps finds and parses a roadmap project", async () => {
    // We created __mock__/project with a roadmap dir
    const scanPaths = [join(process.cwd(), "__mock__")];
    const roadmaps = await scanForRoadmaps(scanPaths);
    
    expect(roadmaps.length).toBe(1);
    const project = roadmaps[0];
    if (!project) throw new Error("Project not found");
    
    expect(project.title).toBe("Test Project");
    expect(project.goal).toBe("Test Goal");
    expect(project.workUnits.length).toBe(1);
    
    const unit = project.workUnits[0];
    if (!unit) throw new Error("Unit not found");
    expect(unit.title).toBe("Unit 1");
    expect(unit.status).toBe("done");
    expect(unit.priority).toBe("high");
  });
});
