# Agent notes

- Every PR to `master` adds an entry at the end of `CHANGELOG.md` (`[x.y.z] - YYYY-MM-DD`, then user-facing bullet points) and bumps `version` with `npm version <patch|minor|major> --no-git-tag-version`, so `package.json` and `package-lock.json` match.
- The version is for people only: the service worker updates on every build by itself.
