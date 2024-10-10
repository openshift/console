import * as React from 'react';
import * as classNames from 'classnames';

export const Loading: React.FCC<LoadingProps> = ({ className }) => (
  <div
    className={classNames('co-m-loader co-an-fade-in-out', className)}
    data-test="loading-indicator"
  >
    <div className="co-m-loader-dot__one" />
    <div className="co-m-loader-dot__two" />
    <div className="co-m-loader-dot__three" />
  </div>
);
Loading.displayName = 'Loading';

type LoadingProps = {
  className?: string;
};
