import path from "path";

const stripSuffix = (value: string, suffix: RegExp) =>
  value.replace(suffix, "");

export const deriveResourceName = (filePath: string) => {
  const base = path.basename(filePath).replace(/\.[tj]sx?$/i, "");
  const normalized = stripSuffix(
    stripSuffix(stripSuffix(base, /Data$/i), /Report$/i),
    /List$/i
  );
  return normalized.toLowerCase();
};
