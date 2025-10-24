# Changelog

All notable changes to Bitpixi's Bar will be documented in this file.

## [Unreleased] - 2025-10-14

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

