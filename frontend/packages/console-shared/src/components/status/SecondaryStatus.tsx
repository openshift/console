import * as React from 'react';
import * as _ from 'lodash';

type SecondaryStatusProps = {
  status?: string | string[];
};

const SecondaryStatus: React.FC<SecondaryStatusProps> = ({ status }) => {
  const statusLabel = _.compact(_.concat([], status)).join(', ');
  if (statusLabel) {
    return (
      <div>
        <small className="text-muted">{statusLabel}</small>
      </div>
    );
  }
  return null;
};

export default SecondaryStatus;
