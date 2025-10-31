import * as React from 'react';
import { useSelector } from 'react-redux';
import { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { PluginCSPViolations } from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';
import { ConsolePluginCSPStatus } from './ConsoleOperatorConfig';

const ConsolePluginCSPStatusDetail: React.FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginName = React.useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);
  const cspViolations = useSelector<RootState, PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );

  return <ConsolePluginCSPStatus hasViolations={cspViolations[pluginName] ?? false} />;
};

export default ConsolePluginCSPStatusDetail;
