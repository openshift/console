import type { ReactNode, ComponentType, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../error-boundary';
import { ErrorBoundaryFallbackInline } from './ErrorBoundaryFallbackInline';

type ErrorBoundaryInlineProps = {
  wrapper?: ComponentType<{ children: ReactNode }>;
  children?: ReactNode;
};

/**
 * Mount an error boundary that will render an inline error with modal stack trace.
 * @see ErrorBoundaryPage if you do not need an inline fallback.
 */
export const ErrorBoundaryInline: FC<ErrorBoundaryInlineProps> = ({
  wrapper: Wrapper,
  children,
  ...props
}) => {
  const { t } = useTranslation('console-shared');
  let fallback = ErrorBoundaryFallbackInline;
  if (Wrapper) {
    fallback = (innerProps) => (
      <Wrapper>
        <ErrorBoundaryFallbackInline {...innerProps} />
      </Wrapper>
    );
  }

  return (
    <div role="region" aria-label={t('console-shared~Inline error boundary')}>
      <ErrorBoundary {...props} FallbackComponent={fallback}>
        {children}
      </ErrorBoundary>
    </div>
  );
};
