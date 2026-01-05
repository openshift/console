import type { FC } from 'react';
import * as _ from 'lodash';

type SecondaryStatusProps = {
  status?: string | string[];
  className?: string;
  dataStatusID?: string;
};

const SecondaryStatus: FC<SecondaryStatusProps> = ({ status, className, dataStatusID }) => {
  const statusLabel = _.compact(_.concat([], status)).join(', ');
  const cssClassName = className || '';
  if (statusLabel) {
    return (
      <div data-status-id={dataStatusID}>
        <span className={`${cssClassName} pf-v6-u-font-size-xs pf-v6-u-text-color-subtle`}>
          {statusLabel}
        </span>
      </div>
    );
  }
  return null;
};

export default SecondaryStatus;
