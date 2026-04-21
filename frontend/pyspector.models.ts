export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type DetectionMethod = 'AST' | 'Regex' | 'Taint' | 'AST+Taint' | 'Regex+AST';

export interface ScanResult {
  id: string;
  timestamp: Date;
  target: string;
  filesScanned: number;
  linesScanned: number;
  scanDurationMs: number;
  throughputLps: number;
  engineVersion: string;
  findings: Finding[];
  callGraph: CallGraph;     // prodotto dal Rust core, solo displayato
  summary: ScanSummary;
}

export interface ScanSummary {
  critical: number; high: number; medium: number;
  low: number; info: number; total: number;
  newSinceBaseline: number; resolvedSinceBaseline: number;
}

export interface Finding {
  id: string; ruleId: string; title: string; description: string;
  severity: Severity; method: DetectionMethod;
  file: string; line: number; codeSnippet?: string;
  cweId?: string; owaspCategory?: string;
  taintPath?: TaintPath;
  isBaselined: boolean;
  triageStatus?: 'new' | 'confirmed' | 'false_positive' | 'accepted_risk' | 'fixed';
}

export interface TaintPath {
  source: TaintNode; sink: TaintNode; hops: TaintNode[];
}
export interface TaintNode { file: string; line: number; function: string; label: string; }

/* ── Call Graph ── 
   Struttura 1:1 con l'output JSON del Rust core.
   Nessuna logica di layout qui — viene calcolata in Angular. */
export interface CallGraph {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
}

export interface CallGraphNode {
  id: string; label: string; file: string; line: number;
  type: 'function' | 'method' | 'source' | 'sink' | 'tainted';
  severity?: Severity;
  callCount: number;
  isEntryPoint: boolean;
  module: string;
}

export interface CallGraphEdge {
  id: string; source: string; target: string;
  label?: string; isTainted: boolean; callLine: number;
}

export interface User {
  id: string; name: string; email: string;
  role: 'Admin' | 'Analyst' | 'Developer' | 'Viewer';
  avatarInitials: string;
}