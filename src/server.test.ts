import { expect, test, describe, afterAll } from "bun:test";
import { startServer } from "./server";
import { join } from "node:path";

describe("server", () => {
  test("server starts and serves /api/roadmaps", async () => {
    const scanPaths = [join(process.cwd(), "__mock__")];
    const server = await startServer(scanPaths, 3001); // use different port

    const response = await fetch(`http://localhost:${server.port}/api/roadmaps`);
    expect(response.status).toBe(200);
    const data = await response.json() as any[];
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].title).toBe("Test Project");

    server.stop();
  });

  test("server serves html on /", async () => {
    const scanPaths = [join(process.cwd(), "__mock__")];
    const server = await startServer(scanPaths, 3002);

    const response = await fetch(`http://localhost:${server.port}/`);
    expect(response.status).toBe(200);
    const text = await response.text();
    
    expect(text).toContain("<!DOCTYPE html>");
    expect(text).toContain("Test Project");

    server.stop();
  });
});
