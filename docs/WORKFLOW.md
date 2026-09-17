# UniMarket Development Workflow

## Branching

- `main` is the integration branch. Do not push commits directly to `main`.
- Create a branch from the latest `main` for each issue:

```bash
git checkout main
git pull
git checkout -b feature/create-listing
```

- Branch names: `feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
- Open a pull request into `main`. At least one teammate must review and
  approve before merge.

## Protecting main (repo admin)

On GitHub: Settings → Branches → Add branch protection rule for `main`.

- Require a pull request before merging
- Require at least 1 approval
- Do not allow bypassing the rule if the plan allows it

## Code standards

- ESLint: already configured by `create-next-app`
- Prettier: `.prettierrc` is in the repo

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

Format before you commit:

```bash
npx prettier --write .
```

## Issue workflow

1. Pick an issue from the Project Board.
2. Move it to In Progress and assign yourself.
3. Implement on a feature branch.
4. Open a PR that references the issue (`Closes #12`).
5. After merge, move the issue to Done.
