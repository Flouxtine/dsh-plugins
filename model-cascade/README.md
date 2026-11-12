# model-cascade

A two-stage model cascade for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness),
reachable from a left-sidebar entry.

A strong **decision** model reads the task and classifies it as `simple` or
`complex`. The cascade then executes the task with the matching model: the
small, fast model for routine work, the strong model for everything else. The
panel draws the flow, keeps the last runs, and reports how often the cheap
model was enough.

## Install

From a local checkout:

```sh
dsh plugin --profile <name> add link:<absolute path to this directory>
```

Or from GitHub with a subdirectory git spec:

```
github:Flouxtine/dsh-plugins#main&path:/model-cascade
```

## Use

1. Open the **Model Cascade** panel from the left sidebar.
2. Pick a decision model, a complex model, and a simple model.
3. Type a task and press **Run**.
4. Read the decision, the answer, and the per-run token usage.

The switch at the top enables the routing stage. With it off, every task goes
straight to the complex model, which makes the cascade a single-stage run.

## Design notes

The cascade is an explicit run, not an agent-loop interceptor. DeepSeek Harness
freezes every agent-loop request and treats the session log as the only source
of truth, so a plugin must not silently re-route a logged request to a different
model. Running the cascade from the panel keeps the request the model actually
served, and the run record keeps the decision auditable.

Settings live in `$DSH_HOME/model-cascade-settings.json`; run history lives in
`$DSH_HOME/model-cascade-history.json` (latest 50 runs). Both are caches the
panel can rebuild.

## License

MIT — see [LICENSE](LICENSE).
