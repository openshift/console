import * as React from 'react';
import * as _ from 'lodash';

type SecondaryStatusProps = {
  status?: string | string[];
  className?: string;
  dataTest?: string;
};

const SecondaryStatus: React.FC<SecondaryStatusProps> = ({ status, className, dataTest }) => {
  const statusLabel = _.compact(_.concat([], status)).join(', ');
  const cssClassName = className || '';
  if (statusLabel) {
    return (
      <div data-test={dataTest}>
        <small className={`${cssClassName} text-muted`}>{statusLabel}</small>
      </div>
    );
  }
  return null;
};

export default SecondaryStatus;
