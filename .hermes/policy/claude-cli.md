# Honbabseoul Claude CLI Invocation Policy

Status: Adopted from Hermes Core Recommended policy on 2026-05-04.

When Codex Desktop or another GUI-launched agent invokes Claude Code, treat command entry and workspace access as separate checks.

Use the Claude executable by absolute path when the launcher environment may not include Homebrew or nvm paths. For this workspace, the known executable is `/opt/homebrew/bin/claude`.

Run Claude from the project directory whose files it must inspect. If one Claude review must inspect multiple project directories, grant only those directories for that invocation with `--add-dir`.

Do not add broad cross-project read patterns such as `/Users/mero/Dev/**` to Claude user settings. Cross-project access should be scoped per invocation.

## Source Provenance

- Hermes Core policy: `/Users/mero/Dev/13.claude/templates/hermes-essence/policy/claude-cli.md`.
- Honbabseoul log entries where Claude-first plan review was attempted but `claude` was unavailable in the current shell PATH.
- Claude and Codex review on 2026-05-04 diagnosing GUI PATH and Claude workspace access separately.

## Scope

This policy applies when Honbabseoul asks Claude Code to review, plan, inspect files, or otherwise act from Codex Desktop or another non-login-shell launcher.

It does not require bypassing Claude permissions, changing global Claude settings, or weakening project isolation.

## Diagnostic Order

First check whether Claude started:

- If `claude` is not found, use the known absolute executable path.
- If the absolute executable fails authentication, treat it as a Claude auth issue.

Then check whether Claude can access the files:

- If the target files are in Honbabseoul, run Claude with the Honbabseoul project root as the working directory.
- If the target files span multiple projects, keep the working directory narrow and add only the needed extra directories with `--add-dir`.
- If Claude reports a read-permission denial, do not treat it as an auth failure.

## Blocked Patterns

- Broad permanent read grants across all project directories.
- Treating `claude -p` as permission bypass for files outside the workspace.
- Using login-shell wrappers as the default fix for GUI PATH drift.
- Collapsing `command not found`, `Not logged in`, and file read denial into one generic "Claude failed" diagnosis.

## Recording

If a Claude review is skipped or delayed because of PATH, authentication, or workspace access, record which layer failed and how it was resolved in `.hermes/logs/log.md`.
