import * as React from 'react';
import * as _ from 'lodash';
import { FirehoseResult } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s';
import { MultiStreamLogs } from './MultiStreamLogs';

type LogsWrapperComponentProps = {
  obj?: FirehoseResult<PodKind>;
  taskName: string;
  downloadAllLabel?: string;
  onDownloadAll?: () => Promise<Error>;
};

const LogsWrapperComponent: React.FC<LogsWrapperComponentProps> = ({ obj, ...props }) => {
  const ref = React.useRef(obj?.data);
  if (!_.isEmpty(obj?.data)) {
    ref.current = obj.data;
  }
  return ref.current ? <MultiStreamLogs {...props} resource={ref.current} /> : null;
};

export default LogsWrapperComponent;
