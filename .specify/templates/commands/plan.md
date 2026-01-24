# /speckit.plan Workflow

**Purpose**: Generate `specs/[###-feature]/plan.md` from the feature spec.

## Required Outputs

- Populate the Summary and Technical Context based on research.
- Complete the Constitution Check gates from `.specify/memory/constitution.md`.
- For performance-sensitive features, define targets and how they will be
  measured.
- Document real project paths in the Project Structure section.

## Enforcement

- Use pnpm + Turborepo for all scripts.
- Keep TypeScript strict and prefer types in `packages/domain`.
- UI uses Tamagui and the shared `@zusamn/ui` provider.
- Do not include secrets; document new env vars in `.env.example`.
