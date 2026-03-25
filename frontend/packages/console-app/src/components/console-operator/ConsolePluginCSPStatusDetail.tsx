import type { FC } from 'react';
import { useMemo } from 'react';
import type { DetailsItemComponentProps } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import type { PluginCSPViolations } from '@console/internal/actions/ui';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { ConsolePluginCSPStatus } from './ConsoleOperatorConfig';

const ConsolePluginCSPStatusDetail: FC<DetailsItemComponentProps> = ({ obj }) => {
  const pluginName = useMemo(() => obj?.metadata?.name, [obj?.metadata?.name]);
  const cspViolations = useConsoleSelector<PluginCSPViolations>(({ UI }) =>
    UI.get('pluginCSPViolations'),
  );

  return <ConsolePluginCSPStatus hasViolations={cspViolations[pluginName] ?? false} />;
};

export default ConsolePluginCSPStatusDetail;
