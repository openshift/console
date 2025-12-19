import { Spinner } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import './Loading.scss';

export const Loading: Snail.FCC<LoadingProps> = ({ className, isInline }) => (
  // the extra div wrapper is needed as `Spinner`'s `className` property
  // is a `SVGAnimatedString`, and not `string`, which breaks tests
  (<div
    className={css('co-m-loader', { 'co-m-loader--inline': isInline }, className)}
    data-test="loading-indicator"
  >
    <Spinner aria-live="polite" aria-busy="true" isInline={isInline} size="lg" />
  </div>)
);

Loading.displayName = 'Loading';

type LoadingProps = {
  className?: string;
  isInline?: boolean;
};
