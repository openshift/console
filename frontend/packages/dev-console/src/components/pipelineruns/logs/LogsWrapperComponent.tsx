import * as React from 'react';
import * as _ from 'lodash';
import { MultiStreamLogs } from './MultiStreamLogs';
import { FirehoseResult } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s';

type LogsWrapperComponentProps = {
  obj?: FirehoseResult<PodKind>;
  taskName: string;
};

const LogsWrapperComponent: React.FC<LogsWrapperComponentProps> = ({ obj, taskName }) => {
  const ref = React.useRef(obj?.data);
  if (!_.isEmpty(obj?.data)) {
    ref.current = obj.data;
  }
  return ref.current ? <MultiStreamLogs taskName={taskName} resource={ref.current} /> : null;
};

export default LogsWrapperComponent;
