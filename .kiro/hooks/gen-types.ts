#!/usr/bin/env node
/**
 * Generate Types Hook
 * 
 * Generates TypeScript interfaces and JSON Schemas from YAML specifications.
 * Outputs to packages/types/src/gen/ directory.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

interface SpecField {
  id: string;
  type: string;
  values?: string[];
  max?: number;
  min?: number;
  pattern?: string;
  required_if?: string;
  optional?: boolean;
  description?: string;
  schema?: any;
}

interface Spec {
  name: string;
  version: number;
  description?: string;
  fields: SpecField[];
  validation?: any;
  generation?: any;
}

class TypeGenerator {
  private genDir = 'packages/types/src/gen';

  constructor() {
    // Ensure gen directory exists
    mkdirSync(this.genDir, { recursive: true });
  }

  /**
   * Generate all types from specifications
   */
  async generateAll(): Promise<void> {
    console.log('🔄 Generating types from specifications...');

    // Load specifications
    const drinkSpec = this.loadSpec('.kiro/specs/drink.yaml');
    const shopSpec = this.loadSpec('.kiro/specs/shop.yaml');

    // Generate TypeScript interfaces
    await this.generateTypeScriptTypes(drinkSpec, shopSpec);

    // Generate JSON Schemas
    await this.generateJsonSchemas(drinkSpec, shopSpec);

    // Update index file
    await this.updateIndexFile();

    console.log('✅ Type generation completed!');
  }

  /**
   * Load YAML specification file
   */
  private loadSpec(path: string): Spec {
    const content = readFileSync(path, 'utf8');
    return parse(content);
  }

  /**
   * Generate TypeScript interface definitions
   */
  private async generateTypeScriptTypes(drinkSpec: Spec, shopSpec: Spec): Promise<void> {
    const output: string[] = [];

    // File header
    output.push('// Generated TypeScript types from YAML specifications');
    output.push('// DO NOT EDIT - This file is auto-generated');
    output.push('');

    // Generate Drink interface
    output.push('/**');
    output.push(` * ${drinkSpec.description || 'Drink specification'}`);
    output.push(' */');
    output.push('export interface Drink {');
    
    for (const field of drinkSpec.fields) {
      const optional = field.optional || field.required_if ? '?' : '';
      const type = this.getTypeScriptType(field);
      
      if (field.description) {
        output.push(`  /** ${field.description} */`);
      }
      output.push(`  ${field.id}${optional}: ${type};`);
    }
    output.push('}');
    output.push('');

    // Generate Layer interface for layered drinks
    output.push('/**');
    output.push(' * Layer configuration for layered drinks');
    output.push(' */');
    output.push('export interface Layer {');
    output.push('  /** Hex color of the layer */');
    output.push('  color: string;');
    output.push('  /** Percentage of total drink volume */');
    output.push('  percent: number;');
    output.push('}');
    output.push('');

    // Generate enum types
    output.push('// Enum types');
    for (const field of drinkSpec.fields) {
      if (field.type === 'enum' && field.values) {
        const enumName = this.toPascalCase(field.id) + 'Type';
        output.push(`export type ${enumName} = ${field.values.map(v => `'${v}'`).join(' | ')};`);
      }
    }
    output.push('');

    // Generate shop-related types
    output.push('/**');
    output.push(' * Drink state in the shop system');
    output.push(' */');
    output.push('export interface DrinkState {');
    output.push('  id: string;');
    output.push('  state: DrinkStateType;');
    output.push('  score: number;');
    output.push('  authorUid: string;');
    output.push('  thumbUrl: string;');
    output.push('  createdAt: number;');
    output.push('  redditPostId?: string;');
    output.push('}');
    output.push('');

    output.push('export type DrinkStateType = \'PENDING\' | \'FEATURED\' | \'RETIRED\';');
    output.push('');

    output.push('/**');
    output.push(' * Player progression and statistics');
    output.push(' */');
    output.push('export interface PlayerStats {');
    output.push('  uid: string;');
    output.push('  drinksCreated: number;');
    output.push('  customComponentsUnlocked: boolean;');
    output.push('  totalScore: number;');
    output.push('  featuredDrinks: string[];');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Vote event data');
    output.push(' */');
    output.push('export interface VoteEvent {');
    output.push('  drinkId: string;');
    output.push('  userId: string;');
    output.push('  direction: 1 | -1;');
    output.push('  timestamp: number;');
    output.push('}');
    output.push('');

    output.push('/**');
    output.push(' * Validation result');
    output.push(' */');
    output.push('export interface ValidationResult {');
    output.push('  valid: boolean;');
    output.push('  errors: string[];');
    output.push('}');

    // Write to file
    const filePath = join(this.genDir, 'types.ts');
    writeFileSync(filePath, output.join('\n'));
    console.log(`📝 Generated TypeScript types: ${filePath}`);
  }

  /**
   * Generate JSON Schema definitions
   */
  private async generateJsonSchemas(drinkSpec: Spec, shopSpec: Spec): Promise<void> {
    const schemas: any = {};

    // Generate Drink schema
    schemas.Drink = {
      type: 'object',
      description: drinkSpec.description,
      properties: {},
      required: [],
      additionalProperties: false
    };

    for (const field of drinkSpec.fields) {
      const schema = this.getJsonSchemaType(field);
      schemas.Drink.properties[field.id] = schema;
      
      if (!field.optional && !field.required_if) {
        schemas.Drink.required.push(field.id);
      }
    }

    // Add validation rules
    if (drinkSpec.validation) {
      schemas.Drink.allOf = [
        {
          if: { properties: { mixMode: { const: 'blend' } } },
          then: { required: ['color'] }
        },
        {
          if: { properties: { mixMode: { const: 'layered' } } },
          then: { required: ['layers'] }
        }
      ];
    }

    // Generate Layer schema
    schemas.Layer = {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          pattern: '^#([A-Fa-f0-9]{6})$',
          description: 'Hex color of the layer'
        },
        percent: {
          type: 'number',
          minimum: 1,
          maximum: 100,
          description: 'Percentage of total drink volume'
        }
      },
      required: ['color', 'percent'],
      additionalProperties: false
    };

    // Generate output
    const output: string[] = [];
    output.push('// Generated JSON Schemas from YAML specifications');
    output.push('// DO NOT EDIT - This file is auto-generated');
    output.push('');
    output.push('export const schemas = {');
    
    for (const [name, schema] of Object.entries(schemas)) {
      output.push(`  ${name}: ${JSON.stringify(schema, null, 2).replace(/\n/g, '\n  ')},`);
    }
    
    output.push('} as const;');
    output.push('');
    output.push('export type SchemaName = keyof typeof schemas;');

    // Write to file
    const filePath = join(this.genDir, 'schemas.ts');
    writeFileSync(filePath, output.join('\n'));
    console.log(`📝 Generated JSON schemas: ${filePath}`);
  }

  /**
   * Update the index file to export generated types
   */
  private async updateIndexFile(): Promise<void> {
    const indexPath = 'packages/types/src/index.ts';
    const content = `// Re-export all types from generated and manual types
export * from './types/api.js';

// Generated types
export * from './gen/types.js';
export * from './gen/schemas.js';
`;

    writeFileSync(indexPath, content);
    console.log(`📝 Updated index file: ${indexPath}`);
  }

  /**
   * Convert field specification to TypeScript type
   */
  private getTypeScriptType(field: SpecField): string {
    switch (field.type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'enum':
        return field.values ? field.values.map(v => `'${v}'`).join(' | ') : 'string';
      case 'string[]':
        return 'string[]';
      case 'object[]':
        if (field.id === 'layers') {
          return 'Layer[]';
        }
        return 'object[]';
      default:
        return 'any';
    }
  }

  /**
   * Convert field specification to JSON Schema type
   */
  private getJsonSchemaType(field: SpecField): any {
    const schema: any = {
      description: field.description
    };

    switch (field.type) {
      case 'string':
        schema.type = 'string';
        if (field.pattern) schema.pattern = field.pattern;
        if (field.max) schema.maxLength = field.max;
        break;
      case 'number':
        schema.type = 'number';
        if (field.min !== undefined) schema.minimum = field.min;
        if (field.max !== undefined) schema.maximum = field.max;
        break;
      case 'boolean':
        schema.type = 'boolean';
        break;
      case 'enum':
        schema.type = 'string';
        schema.enum = field.values;
        break;
      case 'string[]':
        schema.type = 'array';
        schema.items = { type: 'string' };
        if (field.max) schema.maxItems = field.max;
        break;
      case 'object[]':
        schema.type = 'array';
        if (field.schema) {
          schema.items = {
            type: 'object',
            properties: {},
            required: Object.keys(field.schema)
          };
          for (const [key, value] of Object.entries(field.schema)) {
            schema.items.properties[key] = this.getJsonSchemaType(value as SpecField);
          }
        }
        if (field.max) schema.maxItems = field.max;
        break;
      default:
        schema.type = 'string';
    }

    return schema;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|_)([a-z])/g, (_, char) => char.toUpperCase());
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new TypeGenerator();
  generator.generateAll().catch(console.error);
}

export { TypeGenerator };
