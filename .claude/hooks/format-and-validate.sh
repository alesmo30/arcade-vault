#!/usr/bin/env bash
# PostToolUse hook: format with Prettier/ESLint, then validate for leftover
# irregular whitespace or unfixable lint issues. Silent on success; on
# problems, emits JSON so Claude sees what still needs manual attention.
set -uo pipefail

input=$(cat)
f=$(printf '%s' "$input" | jq -r '.tool_response.filePath // .tool_input.file_path // empty')

[ -n "$f" ] && [ -f "$f" ] || exit 0

case "$f" in
  "$CLAUDE_PROJECT_DIR"/*) ;;
  *) exit 0 ;;
esac

npx --no-install prettier --write --ignore-unknown "$f" >/dev/null 2>&1

case "$f" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs)
    npx --no-install eslint --fix "$f" >/dev/null 2>&1
    ;;
esac

issues=""

irregular=$(perl -ne '
  if (/[\x{00A0}\x{feff}\x{200B}-\x{200D}\x{2000}-\x{200A}\x{202F}\x{205F}\x{3000}]/) {
    print "$.: $_";
  }
' "$f" 2>/dev/null)
[ -n "$irregular" ] && issues="${issues}Espacios en blanco irregulares (NBSP/zero-width/BOM) en $f:\n${irregular}\n"

trailing=$(perl -ne 'print "$.: $_" if /[ \t]+$/' "$f" 2>/dev/null)
[ -n "$trailing" ] && issues="${issues}Espacios sobrantes al final de línea en $f:\n${trailing}\n"

case "$f" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs)
    lint_out=$(npx --no-install eslint "$f" 2>&1)
    if [ $? -ne 0 ]; then
      issues="${issues}ESLint reporta problemas que Prettier/--fix no resolvieron en ${f}:\n${lint_out}\n"
    fi
    ;;
esac

if [ -n "$issues" ]; then
  jq -n --arg msg "$issues" '{
    systemMessage: "Formato aplicado, pero quedaron observaciones de whitespace/lint.",
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $msg
    }
  }'
fi

exit 0
