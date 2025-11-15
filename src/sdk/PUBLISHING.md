# Publishing Guide for @nirmitee/fhir-sdk

This guide explains how to publish the FHIR SDK to npm.

## Prerequisites

1. **npm Account**
   - Create an account at https://www.npmjs.com/signup
   - Verify your email

2. **npm Login**
   ```bash
   npm login
   ```

3. **Organization Setup** (if using @nirmitee scope)
   - Create organization at https://www.npmjs.com/org/create
   - Or request access to existing organization

## Pre-Publishing Checklist

- [ ] All tests passing (`npm run test:sdk`)
- [ ] Code coverage acceptable (>70%)
- [ ] Version number updated in `package.json`
- [ ] `README.npm.md` reviewed and up-to-date
- [ ] `LICENSE` file present
- [ ] `CHANGELOG.md` updated with release notes
- [ ] Dependencies reviewed and updated
- [ ] Security vulnerabilities checked (`npm audit`)

## Build and Test

### 1. Install Dependencies

```bash
cd src/sdk
npm install
```

### 2. Install Build Tool

```bash
npm install -D tsup
```

### 3. Run Tests

```bash
npm run test
npm run test:coverage
```

Ensure tests pass and coverage is acceptable.

### 4. Build the Package

```bash
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Generate `.d.ts` type definition files
- Create both CommonJS (`.js`) and ES Module (`.mjs`) formats
- Output to `dist/` directory

### 5. Check Build Output

```bash
ls -la dist/
```

You should see:
```
dist/
├── index.js          # CommonJS entry
├── index.mjs         # ES Module entry
├── index.d.ts        # TypeScript definitions
├── hooks/
│   ├── index.js
│   ├── index.mjs
│   └── index.d.ts
└── ... (other files)
```

## Publishing Steps

### First Time Publishing

#### 1. Check Package Name Availability

```bash
npm view @nirmitee/fhir-sdk
```

If you get an error, the name is available.

#### 2. Set Package Access

For scoped packages (@nirmitee/...), you need to make it public:

```bash
npm access public @nirmitee/fhir-sdk
```

Or add to `package.json`:
```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

#### 3. Publish (Dry Run First)

Test what will be published:

```bash
npm publish --dry-run
```

Review the output carefully. It shows:
- Which files will be included
- Package size
- Any warnings

#### 4. Publish for Real

```bash
npm publish
```

### Subsequent Updates

#### 1. Update Version

Following [Semantic Versioning](https://semver.org/):

**Patch Release** (Bug fixes):
```bash
npm version patch
# 1.0.0 → 1.0.1
```

**Minor Release** (New features, backward compatible):
```bash
npm version minor
# 1.0.0 → 1.1.0
```

**Major Release** (Breaking changes):
```bash
npm version major
# 1.0.0 → 2.0.0
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag

#### 2. Update CHANGELOG.md

Add release notes:
```markdown
## [1.1.0] - 2025-01-XX

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix Z

### Changed
- Updated dependency A
```

#### 3. Run Tests and Build

```bash
npm run test
npm run build
```

#### 4. Publish Update

```bash
npm publish
```

#### 5. Push Git Tags

```bash
git push origin main --tags
```

## Version Strategy

### Version Number Format: MAJOR.MINOR.PATCH

**MAJOR** (Breaking changes):
- API changes that break backward compatibility
- Removing features
- Changing behavior in incompatible ways

Examples:
- Removing or renaming exports
- Changing function signatures
- Removing support for older React versions

**MINOR** (New features):
- Adding new features
- Adding new exports
- Deprecating features (but not removing)

Examples:
- Adding new hooks
- Adding new EMR providers
- Adding new utility functions

**PATCH** (Bug fixes):
- Bug fixes
- Documentation updates
- Performance improvements
- Internal refactoring

Examples:
- Fixing token refresh logic
- Fixing TypeScript types
- Updating documentation

## Beta/Alpha Releases

For testing before official release:

```bash
# Alpha
npm version prerelease --preid=alpha
npm publish --tag alpha

# Beta
npm version prerelease --preid=beta
npm publish --tag beta

# Install with
npm install @nirmitee/fhir-sdk@alpha
npm install @nirmitee/fhir-sdk@beta
```

## Package Contents

What gets published (defined in `package.json` `files` field):

```json
{
  "files": [
    "dist",           # Built JavaScript/TypeScript
    "README.md",      # Main documentation
    "LICENSE",        # License file
    "MODULARITY.md",  # Modularity guide
    "EXAMPLES.md"     # Usage examples
  ]
}
```

What does NOT get published (`.npmignore`):
- Source TypeScript files (except `.d.ts`)
- Tests (`__tests__`)
- Development configs
- `.env` files
- Coverage reports

## Post-Publishing

### 1. Verify Package on npm

Visit: https://www.npmjs.com/package/@nirmitee/fhir-sdk

Check:
- [ ] README displays correctly
- [ ] Version is correct
- [ ] Files are listed
- [ ] Keywords are correct

### 2. Test Installation

In a new directory:

```bash
mkdir test-install
cd test-install
npm init -y
npm install @nirmitee/fhir-sdk
```

Test imports:
```javascript
const sdk = require('@nirmitee/fhir-sdk')
console.log(sdk)
```

### 3. Update Documentation

- Update main project README
- Update examples if API changed
- Announce release (GitHub, social media, etc.)

### 4. Create GitHub Release

1. Go to https://github.com/nirmitee/fhir-sdk/releases
2. Click "Create a new release"
3. Select the version tag
4. Add release notes
5. Publish release

## Troubleshooting

### Error: Package name unavailable

The name `@nirmitee/fhir-sdk` is already taken. Options:
1. Use a different name: `@nirmitee/smart-fhir-sdk`
2. Publish under your personal scope: `@yourusername/fhir-sdk`
3. Use unscoped name: `nirmitee-fhir-sdk` (less preferred)

### Error: 403 Forbidden

You don't have permission to publish. Solutions:
1. Make sure you're logged in: `npm whoami`
2. Check organization membership
3. Set package to public (for scoped packages)

### Error: Build fails

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Error: Tests fail

Don't publish if tests fail. Fix tests first:
```bash
npm run test:verbose
```

### Package size too large

Check what's being included:
```bash
npm pack --dry-run
```

Add more exclusions to `.npmignore` if needed.

## Best Practices

1. **Always test before publishing**
   - Run full test suite
   - Test in clean environment
   - Check package contents

2. **Version carefully**
   - Follow semantic versioning
   - Don't skip versions
   - Update CHANGELOG

3. **Communicate changes**
   - Write clear commit messages
   - Update documentation
   - Announce breaking changes

4. **Security**
   - Run `npm audit` before publishing
   - Keep dependencies updated
   - Don't publish secrets or credentials

5. **Quality**
   - Maintain test coverage
   - Keep bundle size reasonable
   - Provide good documentation

## Quick Reference

```bash
# Development
cd src/sdk
npm install
npm run test
npm run build

# Publishing
npm version [patch|minor|major]
npm run test
npm run build
npm publish

# Verification
npm view @nirmitee/fhir-sdk
```

## Automated Publishing (CI/CD)

For automated publishing via GitHub Actions, see `.github/workflows/publish.yml` (to be created).

## Support

For questions about publishing:
- npm documentation: https://docs.npmjs.com/
- Semantic versioning: https://semver.org/
- npm support: https://www.npmjs.com/support

## Rollback

If you need to unpublish:

```bash
# Unpublish specific version (within 72 hours)
npm unpublish @nirmitee/fhir-sdk@1.0.0

# Deprecate version (preferred)
npm deprecate @nirmitee/fhir-sdk@1.0.0 "This version has critical bugs, use 1.0.1"
```

**Note:** Unpublishing is discouraged and only available for 72 hours. Use deprecation instead.
