---
# The display name shown in menus (defaults to the folder name).
name: my-skill

# What this skill does. Claude uses this to decide when to auto-load it
# based on the conversation topic. Keep it specific and action-oriented.
description: "Describe what this skill does so Claude knows when to use it."

# Hint shown in the autocomplete bar, e.g. "[file-path]" or "[issue-number]".
argument-hint: "[optional-argument]"

# Named arguments available as $argname inside this file.
# arguments: argname

# Prevent Claude from loading this skill automatically — only /command invocations.
# disable-model-invocation: true

# Tools the model may run without a permission prompt while this skill is active.
# allowed-tools:
#   - Bash(npm run lint)
#   - Bash(npm run build)
#   - Read
#   - Edit

# Run in an isolated subagent instead of the main thread.
# context: fork
# agent: general-purpose
---

# My Skill

<!-- Describe what this skill should do in plain language. -->
<!-- The model reads this as instructions when the skill is invoked. -->

## What to do

1. Step one — replace with your first instruction.
2. Step two — replace with your second instruction.

## Arguments

- `$ARGUMENTS` — all text passed after `/my-skill`.

## Context

Current branch and status:

```!
git status --short
git branch --show-current
```

## Notes

- Replace all placeholder text above before using this skill.
- Rename the folder `my-skill` to your desired `/command` name.
- Optionally add supporting files (scripts, templates, examples) in this same folder.
