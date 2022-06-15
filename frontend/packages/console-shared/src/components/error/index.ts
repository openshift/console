// Default ErrorBoundary usage
export { default as ErrorBoundary } from './error-boundary';
export * from './types';

// Packaged, easy to use, fallback options
export { ErrorBoundaryPage, ErrorBoundaryInline } from './fallbacks/convienceWrappers';

// Custom fallback options
export { default as withFallback } from './fallbacks/withFallback';
export { default as ErrorBoundaryFallbackPage } from './fallbacks/ErrorBoundaryFallbackPage';
export { default as ErrorBoundaryFallbackInline } from './fallbacks/ErrorBoundaryFallbackInline';
