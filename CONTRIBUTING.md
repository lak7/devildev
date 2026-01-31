# Contributing to DevilDev

Thank you for your interest in contributing to DevilDev! We're building a spec-driven architecture workspace, and we welcome contributions that help make architecture-first development better.

## Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
```bash
   git clone https://github.com/your-username/devildev.git
   cd devildev
```

3. **Set up your environment** following the [Installation Guide](README.md#installation-guide) - webhooks and services are required for local development.

4. **Create a branch** for your work:
```bash
   git checkout -b feature/your-feature-name
```

## Development Requirements

Before submitting changes, ensure you have:
- Node.js v18+
- PostgreSQL database
- ngrok or similar tunneling service (for webhooks)
- Inngest Dev Server running locally

## Making Changes

**Branch naming:**
- `feature/description` - new features
- `fix/description` - bug fixes
- `docs/description` - documentation

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples:**
```
feat(architecture): add phase visualization to architecture view
fix(webhook): resolve timeout in Inngest functions
docs: update setup instructions for Clerk webhooks
```

## Submitting a Pull Request

1. Ensure your code works locally with all services running
2. Test webhook integrations (Clerk, GitHub, Dodo) if affected
3. Push your branch and open a PR with a clear description of what and why

## Reporting Issues

Before opening an issue, check if it already exists. When reporting:
- Describe the problem clearly
- Include steps to reproduce
- Note your environment (Node version, OS, etc.)
- Include relevant logs or error messages

## Questions?

Open a GitHub issue for bugs or feature requests. For general questions, start a discussion in the repository.

---

Thank you for helping build the future of spec-driven development!