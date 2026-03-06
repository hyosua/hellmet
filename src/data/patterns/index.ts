import { A01_PATTERNS } from "./a01-access-control";
import { A02_PATTERNS } from "./a02-misconfiguration";
import { A03_PATTERNS } from "./a03-supply-chain";
import { A04_PATTERNS } from "./a04-crypto";
import { A05_PATTERNS } from "./a05-injection";
import { A06_PATTERNS } from "./a06-insecure-design";
import { A07_PATTERNS } from "./a07-auth";
import { A08_PATTERNS } from "./a08-integrity";
import { A09_PATTERNS } from "./a09-logging";
import { A10_PATTERNS } from "./a10-exceptions";

export type { VulnerabilityPattern } from "./types";

export const VULNERABILITY_PATTERNS = [
  ...A01_PATTERNS,
  ...A02_PATTERNS,
  ...A03_PATTERNS,
  ...A04_PATTERNS,
  ...A05_PATTERNS,
  ...A06_PATTERNS,
  ...A07_PATTERNS,
  ...A08_PATTERNS,
  ...A09_PATTERNS,
  ...A10_PATTERNS,
];
