import { ComponentType, lazy, ComponentProps, Suspense, useRef, FC } from 'react';
import { LoadingBox } from './status-box';
import { ErrorBoundaryPage } from '@console/shared/src/components/error';

/** A function that lazily loads a component. */
export type LazyLoader<C extends ComponentType> = () => Promise<C>;

export type AsyncComponentProps<C extends ComponentType> = Pick<
  ComponentProps<typeof LoadingBox>,
  'blame'
> & {
  /** The lazy loader function to load the component. Note that this is only called once on mount. */
  loader: LazyLoader<C>;
  /** Optional loading component to show while the component is being loaded. */
  LoadingComponent?: ComponentType<Partial<Pick<ComponentProps<typeof LoadingBox>, 'blame'>>>;
} & ComponentProps<C>;

/** Comparing two functions is not the *best* solution, but we can handle false negatives. */
const sameLoader = (
  a?: LazyLoader<ComponentType<unknown>>,
  b?: LazyLoader<ComponentType<unknown>>,
) => a?.name === b?.name && (a || 'a').toString() === (b || 'b').toString();

/** Maximum number of retries for loading a component. */
const MAX_RETRIES = 25;

/**
 * Wraps a loader function with retry logic using exponential backoff.
 *
 * If the loader fails, it will retry up to {@link MAX_RETRIES} times with
 * increasing delays.
 */
const withRetry = <C extends ComponentType>(loader: LazyLoader<C>): LazyLoader<C> => {
  return async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await loader(); // Attempt to load component
      } catch (error) {
        lastError = error;

        // Wait with exponential backoff before retrying (capped at 30s)
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(100 * Math.pow(2, attempt), 30000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };
};

/**
 * Load a component asynchronously with a loading state.
 */
export const AsyncComponent = <C extends ComponentType>({
  loader,
  LoadingComponent = LoadingBox,
  // Typically import loader strings are of the form "() => import('./path/to/Component').then(c => c.Component)"
  // So we extract "Component" from the end of the string for easier identification.
  blame = String(loader).split('.').pop().replaceAll(')', '') ?? 'AsyncComponent',
  ...props
}: AsyncComponentProps<C>): ReturnType<FC> => {
  /**
   * Use refs to make the loader referentially stable. Only rerender
   * when the loader actually changes according to {@link sameLoader}.
   *
   * This prevents infinite rerenders when inline loader functions are used.
   */
  const loaderRef = useRef<LazyLoader<C> | null>(null);
  const lazyComponentRef = useRef<ReturnType<typeof lazy> | null>(null);

  if (!sameLoader(loaderRef.current, loader)) {
    loaderRef.current = loader;
    lazyComponentRef.current = lazy(() =>
      withRetry(loader)().then((module) => ({ default: module })),
    );
  }

  const LazyComponent = lazyComponentRef.current!;

  /*
   * It's a bit tricky to get TypeScript to understand that props is compatible, while
   * retaining type checking for the rest of AsyncComponentProps.
   *
   * Thus, we keep full type checking for AsyncComponentProps at the cost of this any cast.
   */
  return (
    <ErrorBoundaryPage>
      <Suspense fallback={<LoadingComponent blame={blame} />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    </ErrorBoundaryPage>
  );
};
