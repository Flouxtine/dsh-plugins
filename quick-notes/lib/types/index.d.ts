/**
 * Host half of the Quick Notes bundle.
 *
 * The structural `PluginContext` keeps this declaration dependency-free; the
 * real context is provided by the DSH/Cordis loader at runtime.
 */
export interface PluginContext {
  on(event: string, listener: (...args: any[]) => any, options?: any): () => void;
  effect(effect: () => any, label?: string): unknown;
  get(name: string): any;
  [key: string]: any;
}

export declare function apply(ctx: PluginContext): void;
