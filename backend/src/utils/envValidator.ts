/**
 * Environment variable validator
 * Checks for required environment variables at application startup
 */

import dotenv from 'dotenv';

dotenv.config();

interface EnvValidationRule {
  name: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean';
  default?: string | number | boolean;
  description: string;
}

const envValidationRules: EnvValidationRule[] = [
  {
    name: 'PORT',
    required: false,
    type: 'number',
    default: 3000,
    description: 'Port number for the server to listen on',
  },
  {
    name: 'DB_USER',
    required: true,
    type: 'string',
    description: 'PostgreSQL database username',
  },
  {
    name: 'DB_PASSWORD',
    required: true,
    type: 'string',
    description: 'PostgreSQL database password',
  },
  {
    name: 'DB_HOST',
    required: true,
    type: 'string',
    description: 'PostgreSQL database host',
  },
  {
    name: 'DB_PORT',
    required: false,
    type: 'number',
    default: 5432,
    description: 'PostgreSQL database port',
  },
  {
    name: 'DB_NAME',
    required: true,
    type: 'string',
    description: 'PostgreSQL database name',
  },
  {
    name: 'JWT_SECRET',
    required: true,
    type: 'string',
    description: 'Secret key for JWT token signing and verification',
  },
  {
    name: 'OLLAMA_BASE_URL',
    required: false,
    type: 'string',
    default: 'http://localhost:11434',
    description: 'Base URL for Ollama AI service (optional)',
  },
  {
    name: 'OLLAMA_EMBEDDING_MODEL',
    required: false,
    type: 'string',
    default: 'nomic-embed-text',
    description: 'Ollama model to use for embeddings (optional)',
  },
];

export class EnvValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    this.errors = [];
    this.warnings = [];

    for (const rule of envValidationRules) {
      const value = process.env[rule.name];

      if (rule.required && !value) {
        this.errors.push(`❌ Required environment variable ${rule.name} is missing: ${rule.description}`);
        continue;
      }

      if (!value && rule.default !== undefined) {
        process.env[rule.name] = String(rule.default);
        this.warnings.push(`⚠️  Environment variable ${rule.name} not set, using default: ${rule.default}`);
        continue;
      }

      if (value) {
        // Type validation
        if (rule.type === 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            this.errors.push(`❌ Environment variable ${rule.name} should be a number, got: ${value}`);
          }
        } else if (rule.type === 'boolean') {
          const lowerValue = value.toLowerCase();
          if (!['true', 'false', '0', '1'].includes(lowerValue)) {
            this.errors.push(`❌ Environment variable ${rule.name} should be a boolean, got: ${value}`);
          }
        }
      }
    }

    // Special validation for JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      this.warnings.push(
        `⚠️  JWT_SECRET is only ${jwtSecret.length} characters long. For production, use at least 32 characters.`,
      );
    }

    // Check for default/insecure values
    const insecureDefaults = [
      { name: 'DB_PASSWORD', value: 'password' },
      { name: 'DB_PASSWORD', value: '123456' },
      { name: 'JWT_SECRET', value: 'secret' },
      { name: 'JWT_SECRET', value: 'changeme' },
    ];

    for (const check of insecureDefaults) {
      const envValue = process.env[check.name];
      if (envValue === check.value) {
        this.warnings.push(
          `⚠️  ${check.name} is set to an insecure default value: "${check.value}". Change this in production!`,
        );
      }
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  printValidationReport(): void {
    const result = this.validate();

    console.log('\n=== Environment Validation Report ===\n');

    if (result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach((warning) => console.log(`  ${warning}`));
      console.log();
    }

    if (result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach((error) => console.log(`  ${error}`));
      console.log('\n❌ Application cannot start due to environment validation errors.');
      console.log('   Please fix the errors above and restart the application.\n');
    } else {
      console.log('✅ All environment variables are valid.\n');
    }

    // Print current environment values (masking secrets)
    console.log('Current environment configuration:');
    envValidationRules.forEach((rule) => {
      const value = process.env[rule.name];
      const displayValue = this.maskSecretValue(rule.name, value);
      console.log(`  ${rule.name}=${displayValue} (${rule.description})`);
    });
    console.log();
  }

  private maskSecretValue(name: string, value?: string): string {
    if (!value) return '[NOT SET]';
    
    const secretKeys = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY'];
    const isSecret = secretKeys.some((key) => name.toUpperCase().includes(key));
    
    if (isSecret) {
      return value.length <= 4 
        ? '***' 
        : `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
    }
    
    return value;
  }
}

// Export singleton instance
export const envValidator = new EnvValidator();

// Export validation function for use in index.ts
export const validateEnvironment = (): boolean => {
  const result = envValidator.validate();
  
  if (result.errors.length > 0) {
    console.error('\n❌ Environment validation failed:');
    result.errors.forEach((error) => console.error(`  ${error}`));
    
    if (result.warnings.length > 0) {
      console.warn('\n⚠️  Warnings:');
      result.warnings.forEach((warning) => console.warn(`  ${warning}`));
    }
    
    return false;
  }
  
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:');
    result.warnings.forEach((warning) => console.warn(`  ${warning}`));
  }
  
  return true;
};