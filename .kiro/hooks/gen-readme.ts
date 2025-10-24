#!/usr/bin/env node
/**
 * Generate README Hook
 * 
 * Updates README.md with workflow documentation and creates CHANGELOG.md entries.
 * Demonstrates the spec-driven development process.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

class ReadmeGenerator {
  private readmePath = 'README.md';
  private changelogPath = 'CHANGELOG.md';

  /**
   * Generate all documentation updates
   */
  async generateAll(): Promise<void> {
    console.log('🔄 Generating documentation updates...');

    await this.updateReadme();
    await this.updateChangelog();

    console.log('✅ Documentation generation completed!');
  }

  /**
   * Update README.md with Kiro workflow section
   */
  private async updateReadme(): Promise<void> {
    let content = '';
    
    if (existsSync(this.readmePath)) {
      content = readFileSync(this.readmePath, 'utf8');
    } else {
      content = '# Bitpixi\'s Bar\n\nA Reddit-integrated, cozy drink-making game built with Kiro\'s spec-driven workflow.\n\n';
    }

    // Check if workflow section already exists
    if (content.includes('## Kiro Spec-Driven Workflow')) {
      console.log('📝 README already contains workflow section');
      return;
    }

    const workflowSection = this.generateWorkflowSection();
    
    // Append workflow section
    content += '\n' + workflowSection;

    writeFileSync(this.readmePath, content);
    console.log(`📝 Updated README with workflow documentation: ${this.readmePath}`);
  }

  /**
   * Generate the workflow documentation section
   */
  private generateWorkflowSection(): string {
    return `## Kiro Spec-Driven Workflow

This project showcases Kiro's spec-driven development methodology, where YAML specifications automatically generate TypeScript types, validators, and business logic.

### How Specs → Hooks → Codegen Works

\`\`\`mermaid
graph TD
    A[YAML Specs] --> B[Kiro Hooks]
    B --> C[Generated Code]
    C --> D[Application]
    
    A1[drink.yaml] --> B1[gen-types.ts]
    A2[shop.yaml] --> B1
    B1 --> C1[TypeScript Types]
    B1 --> C2[JSON Schemas]
    
    A1 --> B2[gen-logic.ts]
    A2 --> B2
    B2 --> C3[Business Logic]
    B2 --> C4[Validators]
    
    A1 --> B3[validate-drink.ts]
    B3 --> C5[Real-time Validation]
    
    C1 --> D1[Client App]
    C2 --> D1
    C3 --> D1
    C4 --> D2[Devvit Posts]
    C5 --> D2
\`\`\`

### Development Process

1. **Requirements** - Define user stories with EARS format acceptance criteria
2. **Design** - Create comprehensive architecture from requirements  
3. **Specifications** - Write YAML specs that capture the design
4. **Code Generation** - Hooks automatically generate implementation code
5. **Implementation** - Build features using generated types and logic

### Key Files

#### Specifications
- \`.kiro/specs/drink.yaml\` - Drink recipe schema and validation rules
- \`.kiro/specs/shop.yaml\` - Voting system and player progression
- \`.kiro/steering.yaml\` - Development conventions and guidelines

#### Generated Code (DO NOT EDIT)
- \`packages/types/src/gen/types.ts\` - TypeScript interfaces
- \`packages/types/src/gen/schemas.ts\` - JSON Schema definitions
- \`packages/logic/src/gen/validators.ts\` - Validation functions
- \`packages/logic/src/gen/color-mixing.ts\` - Color blending logic
- \`packages/logic/src/gen/drink-formatting.ts\` - Reddit post formatting

#### Hooks (Automation)
- \`.kiro/hooks/gen-types.ts\` - Generate types from specs
- \`.kiro/hooks/gen-logic.ts\` - Generate business logic
- \`.kiro/hooks/validate-drink.ts\` - Real-time validation

### Running the Demo

1. **Edit a specification:**
   \`\`\`bash
   # Add a new backdrop to drink.yaml
   vim .kiro/specs/drink.yaml
   \`\`\`

2. **Regenerate code:**
   \`\`\`bash
   npx tsx .kiro/hooks/gen-types.ts
   npx tsx .kiro/hooks/gen-logic.ts
   \`\`\`

3. **See the changes:**
   \`\`\`bash
   # New types automatically available
   cat packages/types/src/gen/types.ts
   \`\`\`

4. **Build and test:**
   \`\`\`bash
   pnpm run build
   pnpm run test
   \`\`\`

### Architecture Benefits

- **Type Safety** - Generated types ensure consistency across client/server
- **Validation** - Single source of truth for validation rules
- **Maintainability** - Changes to specs automatically update all code
- **Testing** - Deterministic functions with seeded randomization
- **Documentation** - Specs serve as living documentation

### Game Features

- **Progressive Gameplay** - Zoomed-out bar → drink creation → component design
- **Community Voting** - Reddit integration with automatic post creation
- **Custom Components** - Players create glasses, backdrops, flavors, toppings
- **Three.js Rendering** - Beautiful 3D drink visualization
- **Multiple Themes** - Girly, spooky Halloween, cyberpunk neon aesthetics

### Tech Stack

- **Frontend:** Three.js, TypeScript, Vite
- **Backend:** Devvit Web, Express, Redis
- **Build:** pnpm monorepo with project references
- **Testing:** Vitest with ≥85% coverage requirement
- **CI/CD:** GitHub Actions for type checking and testing

This project demonstrates how spec-driven development can create maintainable, type-safe applications with automated code generation and comprehensive testing.
`;
  }

  /**
   * Update CHANGELOG.md with spec changes
   */
  private async updateChangelog(): Promise<void> {
    let content = '';
    
    if (existsSync(this.changelogPath)) {
      content = readFileSync(this.changelogPath, 'utf8');
    } else {
      content = '# Changelog\n\nAll notable changes to Bitpixi\'s Bar will be documented in this file.\n\n';
    }

    const today = new Date().toISOString().split('T')[0];
    const newEntry = `## [Unreleased] - ${today}

### Added
- Spec-driven development workflow with YAML specifications
- Automated code generation from drink.yaml and shop.yaml specs
- TypeScript type generation with strict validation
- Business logic generation with deterministic color mixing
- Real-time drink validation with comprehensive error messages
- Reddit integration with automatic post creation and voting
- Player progression system (unlock custom components after 1 drink)
- Three aesthetic themes: girly, spooky Halloween, cyberpunk neon
- pnpm monorepo structure with packages for types, logic, and Redis
- Comprehensive documentation with workflow diagrams

### Generated
- TypeScript interfaces for Drink, DrinkState, PlayerStats, ValidationResult
- JSON Schemas for client-side and server-side validation
- Color mixing functions with seeded randomization for testing
- Drink formatting functions for Reddit post creation
- Layer normalization and drink ID generation utilities
- Validation functions for blend/layered modes and name constraints

### Infrastructure
- GitHub Actions CI pipeline for type checking and testing
- ESLint and Prettier configuration for code quality
- Vitest testing framework with coverage requirements
- Project references for efficient TypeScript compilation

`;

    // Prepend new entry after the header
    const lines = content.split('\n');
    const headerEnd = lines.findIndex(line => line.startsWith('## '));
    
    if (headerEnd === -1) {
      content += newEntry;
    } else {
      lines.splice(headerEnd, 0, newEntry);
      content = lines.join('\n');
    }

    writeFileSync(this.changelogPath, content);
    console.log(`📝 Updated changelog: ${this.changelogPath}`);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ReadmeGenerator();
  generator.generateAll().catch(console.error);
}

export { ReadmeGenerator };
