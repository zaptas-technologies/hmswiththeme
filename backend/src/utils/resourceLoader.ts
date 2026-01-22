import path from "path";
import { pathToFileURL } from "url";
import fg from "fast-glob";
import { deriveResourceName } from "./resourceName";

export type ResourceDescriptor = {
  name: string;
  filePath: string;
};

export const FRONT_JSON_DIR = path.resolve(
  __dirname,
  "../../../src/core/json"
);

export const scanResourceFiles = async (): Promise<ResourceDescriptor[]> => {
  const files = await fg(["*.ts", "*.tsx"], {
    cwd: FRONT_JSON_DIR,
    absolute: true,
  });

  return files.map((filePath) => ({
    filePath,
    name: deriveResourceName(filePath),
  }));
};

export const loadDataset = async (
  descriptor: ResourceDescriptor
): Promise<Record<string, unknown>[]> => {
  // Use CJS require; ts-node/register/transpile-only will transpile TS/TSX on the fly.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(descriptor.filePath);
  const firstExport = Object.values(mod)[0];

  if (!Array.isArray(firstExport)) {
    throw new Error(
      `Expected array export in ${descriptor.filePath}, got ${typeof firstExport}`
    );
  }

  return firstExport as Record<string, unknown>[];
};
