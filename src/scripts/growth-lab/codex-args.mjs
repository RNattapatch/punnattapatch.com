// Codex CLI arguments for a tool-less, read-only, structured-output evaluation.
//
// Feature flags differ between Codex versions and `--strict-config` makes an unknown flag fatal
// (codex-cli 0.147 has no `sleep_tool` / `skip_host_skill_discovery`, so a fixed list broke every run).
// So: read `codex features list` once, disable every risky feature this version actually has, and refuse
// to run at all (fail closed) when the list is unreadable or the system-touching tools are not listed.

export const CODEX_RISKY_FEATURES = Object.freeze([
  'shell_tool', 'unified_exec', 'code_mode', 'code_mode_host',
  'plugins', 'plugin_sharing', 'remote_plugin', 'apps', 'enable_mcp_apps',
  'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use',
  'view_image', 'image_generation', 'hooks', 'skill_search', 'skill_mcp_dependency_install', 'workspace_dependencies',
  'multi_agent', 'multi_agent_v2', 'goals', 'sleep_tool', 'standalone_web_search', 'request_permissions_tool', 'tool_suggest',
  'tool_call_mcp_elicitation', 'auth_elicitation', 'memories',
]);

// Without these two disabled the model could run commands, so they must exist in the feature list.
export const CODEX_REQUIRED_DISABLES = Object.freeze(['shell_tool', 'unified_exec']);

const OPTIONAL_ENABLES = Object.freeze(['skip_host_skill_discovery']);

export function parseFeatureList(text) {
  return new Set(String(text ?? '').split('\n').map((line) => line.trim().split(/\s+/u)[0]).filter((name) => /^[a-z0-9_]+$/u.test(name)));
}

export function buildCodexArgs(features) {
  const missing = CODEX_REQUIRED_DISABLES.filter((name) => !features.has(name));
  if (missing.length) {
    throw Object.assign(new Error(`Codex CLI รุ่นนี้ไม่รองรับการปิด ${missing.join(', ')} — ไม่รันเพื่อความปลอดภัย`), { code: 'CODEX_UNSAFE_VERSION', status: 503 });
  }
  return Object.freeze([
    'exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules', '--strict-config',
    ...CODEX_RISKY_FEATURES.filter((name) => features.has(name)).flatMap((name) => ['--disable', name]),
    ...OPTIONAL_ENABLES.filter((name) => features.has(name)).flatMap((name) => ['--enable', name]),
    '-c', 'approval_policy="never"', '-c', 'shell_environment_policy.inherit="none"', '-c', 'web_search="disabled"',
    '-c', 'suppress_unstable_features_warning=true',
  ]);
}
