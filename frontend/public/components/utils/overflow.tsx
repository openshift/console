/* eslint-disable no-undef */

import * as React from 'react';
import * as classNames from 'classnames';

import { selectText } from './index';

/**
 * Displays text that is not expected to fit within its container. Also adds an onClick handler that selects the text.
 */
export const Overflow: React.SFC<OverflowProps> = ({className, value}) => <div className={classNames('co-m-overflow', className)}>
  <input className="co-m-invisible-input co-m-overflow__input" value={value || '-'} readOnly spellCheck={false} onClick={selectText} aria-hidden="true" />
  <span className="sr-only">{value || '-'}</span>
  <div className="co-m-overflow__gradient"></div>
</div>;

export const OverflowLink: React.SFC<OverflowLinkProps> = ({className, href, value}) => <div className={classNames('co-m-overflow', className)}>
  <a className="co-m-overflow__link" href={href}>{value || '-'}</a>
  <div className="co-m-overflow__gradient"></div>
</div>;

/**
 * Displays text that is not expected to fit within its container.
 */
export const OverflowYFade: React.SFC<OverflowYFadeProps> = ({className, children}) => <div className={classNames('co-overflow-y-fade', className)}>
  {children}
  <div className="co-m-overflow__gradient"></div>
</div>;

export type OverflowProps = {
  value: string;
} & React.HTMLAttributes<HTMLDivElement>;

export type OverflowLinkProps = {
  value: string;
  href: string;
} & React.HTMLAttributes<HTMLDivElement>;

export type OverflowYFadeProps = {

} & React.HTMLAttributes<HTMLDivElement>;

Overflow.displayName = 'Overflow';
OverflowYFade.displayName = 'OverflowYFade';
OverflowLink.displayName = 'OverflowLink';
