// Default ErrorBoundary usage
export { default as ErrorBoundary } from './error-boundary';

// Packaged, easy to use, fallback options
export { default as ErrorBoundaryPage } from './fallbacks/ErrorBoundaryPage';
export { default as ErrorBoundaryInline } from './fallbacks/ErrorBoundaryInline';

// Custom fallback options
export { default as withFallback } from './fallbacks/withFallback';
export { default as ErrorBoundaryFallbackPage } from './fallbacks/ErrorBoundaryFallbackPage';
export { default as ErrorBoundaryFallbackInline } from './fallbacks/ErrorBoundaryFallbackInline';
