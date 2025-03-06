import * as React from 'react';
import { Spinner } from '@patternfly/react-core';
import classNames from 'classnames';

export const Loading: React.FC<LoadingProps> = ({ className, isInline }) => (
  <Spinner
    aria-live="polite"
    aria-busy="true"
    className={classNames('co-m-loader', { 'co-m-loader--inline': isInline }, className)}
    data-test="loading-indicator"
    isInline={isInline}
    size="lg"
  />
);

Loading.displayName = 'Loading';

type LoadingProps = {
  className?: string;
  isInline?: boolean;
};
