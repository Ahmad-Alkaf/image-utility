import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FILE_RETENTION_HOURS,
  FILE_RETENTION_MS,
  FORMAT_LABELS,
  FORMAT_MIME_TYPES,
  getTool,
  MIME_TO_FORMAT,
  RATE_LIMITS,
  SUPPORTED_FORMATS,
  TOOL_ACCEPTED_TYPES,
  TOOLS,
  UPLOAD_LIMITS,
  type ToolId,
} from "@/lib/constants";

const BROWSER_ONLY_TOOLS: ToolId[] = ["remove-bg"];

function routeExists(id: string): boolean {
  return existsSync(fileURLToPath(new URL(`../src/app/api/process/${id}/route.ts`, import.meta.url)));
}

describe("TOOLS registry", () => {
  it("has unique ids and hrefs", () => {
    const ids = TOOLS.map((t) => t.id);
    const hrefs = TOOLS.map((t) => t.href);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("links every tool to /<id>", () => {
    for (const tool of TOOLS) expect(tool.href, tool.id).toBe(`/${tool.id}`);
  });

  it("has unique names, titles, and short labels", () => {
    for (const field of ["name", "title", "shortLabel", "description", "seoDescription"] as const) {
      const values = TOOLS.map((t) => t[field]);
      expect(new Set(values).size, field).toBe(values.length);
      expect(values.every((v) => v.trim().length > 0), field).toBe(true);
    }
  });

  it("declares accepted MIME types for every tool and nothing else", () => {
    const ids = TOOLS.map((t) => t.id).sort();
    expect(Object.keys(TOOL_ACCEPTED_TYPES).sort()).toEqual(ids);
    for (const [id, types] of Object.entries(TOOL_ACCEPTED_TYPES)) {
      expect(types.length, id).toBeGreaterThan(0);
      expect(new Set(types).size, id).toBe(types.length);
      for (const type of types) expect(type, id).toMatch(/^image\//);
    }
  });

  it("has an API route for every server tool and none for browser-only tools", () => {
    for (const tool of TOOLS) {
      const browserOnly = BROWSER_ONLY_TOOLS.includes(tool.id as ToolId);
      expect(routeExists(tool.id), tool.id).toBe(!browserOnly);
    }
  });

  it("keeps the browser-only tool limited to formats the WASM model reads", () => {
    expect(TOOL_ACCEPTED_TYPES["remove-bg"]).not.toContain("image/svg+xml");
    expect(TOOL_ACCEPTED_TYPES["remove-bg"]).not.toContain("image/tiff");
  });

  it("only accepts SVG on tools that do not write back the input format", () => {
    for (const [id, types] of Object.entries(TOOL_ACCEPTED_TYPES)) {
      const acceptsSvg = types.includes("image/svg+xml");
      expect(acceptsSvg, id).toBe(id === "convert" || id === "metadata");
    }
  });
});

describe("getTool", () => {
  it("returns the definition for a known id", () => {
    expect(getTool("convert").href).toBe("/convert");
  });

  it("throws for an unknown id", () => {
    expect(() => getTool("sharpen" as ToolId)).toThrow(/Unknown tool: sharpen/);
  });
});

describe("format tables", () => {
  it("cover exactly the supported formats", () => {
    const formats = [...SUPPORTED_FORMATS].sort();
    expect(Object.keys(FORMAT_LABELS).sort()).toEqual(formats);
    expect(Object.keys(FORMAT_MIME_TYPES).sort()).toEqual(formats);
  });

  it("map every output MIME type back to its format", () => {
    for (const format of SUPPORTED_FORMATS) {
      expect(MIME_TO_FORMAT[FORMAT_MIME_TYPES[format]], format).toBe(format);
    }
    expect(MIME_TO_FORMAT["image/jpg"]).toBe("jpeg");
    for (const format of Object.values(MIME_TO_FORMAT)) expect(SUPPORTED_FORMATS).toContain(format);
  });

  it("use image/* MIME types", () => {
    for (const mime of Object.values(FORMAT_MIME_TYPES)) expect(mime).toMatch(/^image\/[a-z]+$/);
  });
});

describe("limits", () => {
  it("give signed-in users more than anonymous users", () => {
    expect(UPLOAD_LIMITS.authenticated.maxFileSize).toBeGreaterThan(UPLOAD_LIMITS.anonymous.maxFileSize);
    expect(UPLOAD_LIMITS.authenticated.maxFiles).toBeGreaterThan(UPLOAD_LIMITS.anonymous.maxFiles);
    expect(RATE_LIMITS.authenticated.maxRequests).toBeGreaterThan(RATE_LIMITS.anonymous.maxRequests);
  });

  it("derive the retention in milliseconds from the hours", () => {
    expect(FILE_RETENTION_MS).toBe(FILE_RETENTION_HOURS * 60 * 60 * 1000);
  });
});
