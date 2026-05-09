/**
 * Shivi AI Memory System - Module Exports
 * Unified exports for the complete memory system
 */

// Core types and interfaces
export * from './core/types';
export * from './core/engine';

// Storage layer
export * from './storage/database';

// Security and encryption
export * from './security/encryption';

// Semantic search
export * from './semantic/search';

// Emotional memory
export * from './emotional/engine';

// Retrieval pipeline
export * from './retrieval/pipeline';

// Indexing
export * from './indexing/engine';

// Main memory engine (convenience export)
export { memoryEngine } from './core/engine';