/**
 * Host half of the Model Cascade bundle.
 *
 * The structural `PluginContext` keeps this declaration dependency-free; the
 * real context is provided by the DSH/Cordis loader at runtime.
 */
export interface ModelTarget {
  provider: string;
  model: string;
}

export interface ModelCascadeSettings {
  enabled: boolean;
  decision: ModelTarget;
  complex: ModelTarget;
  simple: ModelTarget;
}

export interface ModelCascadeRun {
  id: string;
  createdAt: number;
  prompt: string;
  enabled: boolean;
  route: 'simple' | 'complex' | 'error';
  reason: string;
  decisionText: string;
  decisionProvider: string;
  decisionModel: string;
  executorProvider: string;
  executorModel: string;
  answer: string;
  usage: Record<string, number> | null;
  decisionUsage: Record<string, number> | null;
  durationMs: number;
  error: string;
}

export interface PluginContext {
  on(event: string, listener: (...args: any[]) => any, options?: any): () => void;
  effect(effect: () => any, label?: string): unknown;
  get(name: string): any;
  webServer: any;
  [key: string]: any;
}

export declare const inject: string[];

export declare function apply(ctx: PluginContext): void;
