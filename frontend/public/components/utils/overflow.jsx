import * as React from 'react';
import * as classNames from'classnames';

import {selectText} from './index';

// Displays text that is not expected to fit within its container. Also adds an onClick handler that selects the text.
/** @type {React.StatelessComponent<{value: string} & React.HTMLAttributes<HTMLDivElement>>} */
export const Overflow = ({className, value}) => <div className={classNames('co-m-overflow', className)}>
  <input className="co-m-invisible-input co-m-overflow__input" value={value || '-'} readOnly spellCheck="false" onClick={selectText} />
  <div className="co-m-overflow__gradient"></div>
</div>;

/** @type {React.StatelessComponent<{value: string, href: string} & React.HTMLAttributes<HTMLDivElement>>} */
export const OverflowLink = ({className, href, value}) => <div className={classNames('co-m-overflow', className)}>
  <a href={href}>{value || '-'}</a>
  <div className="co-m-overflow__gradient"></div>
</div>;

// Displays text that is not expected to fit within its container
/** @type {React.StatelessComponent<React.HTMLAttributes<HTMLDivElement>>} */
export const OverflowYFade = ({className, children}) => <div className={classNames('co-overflow-y-fade', className)}>
  {children}
  <div className="co-m-overflow__gradient"></div>
</div>;

Overflow.displayName = 'Overflow';
OverflowYFade.displayName = 'OverflowYFade';
OverflowLink.displayName = 'OverflowLink';
