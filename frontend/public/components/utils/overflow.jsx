import * as React from 'react';
import * as classNames from'classnames';

import {selectText} from './index';

// Displays text that is not expected to fit within its container. Also adds an onClick handler that selects the text.
/** @type {React.StatelessComponent<{className?: string, value: string}>} */
export const Overflow = ({className, value}) => <div className={classNames('co-m-overflow', className)}>
  <input className="co-m-invisible-input co-m-overflow__input" value={value || '-'} readOnly spellCheck="false" onClick={selectText} />
  <div className="co-m-overflow__gradient"></div>
</div>;

// Displays text that is not expected to fit within its container
export const OverflowYFade = ({className, children}) => <div className={classNames('co-overflow-y-fade', className)}>
  {children}
  <div className="co-m-overflow__gradient"></div>
</div>;
