import type { FC } from 'react';
import { useMemo } from 'react';
import { Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ResourceLink } from '@console/internal/components/utils';
import { MachineHealthCheckModel } from '@console/internal/models';
import type { K8sResourceKind, MachineHealthCheckKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { NodeHealthCheckKind } from '../../utils/HealthCheckUtils';
import {
  formatHealthCheckSelector,
  formatUnhealthyConditionsDisplay,
  getMachineHealthCheckScope,
  getNodeHealthCheckScope,
  NodeHealthCheckModel,
} from '../../utils/HealthCheckUtils';

type HealthCheckRow = {
  model: typeof MachineHealthCheckModel | typeof NodeHealthCheckModel;
  name: string;
  namespace?: string;
  scopeDisplay: string;
  selectorDisplay: string;
  unhealthyConditionsDisplay: string;
  lastTriggeredTimestamp: string | undefined;
};

type HealthChecksProps = {
  matchingMachineHealthChecks: MachineHealthCheckKind[];
  matchingNodeHealthChecks: NodeHealthCheckKind[];
  isLoading: boolean;
  loadError?: unknown;
};

const HealthChecks: FC<HealthChecksProps> = ({
  matchingMachineHealthChecks,
  matchingNodeHealthChecks,
  isLoading,
  loadError,
}) => {
  const { t } = useTranslation();
  const rows: HealthCheckRow[] = useMemo(() => {
    const mhcRows: HealthCheckRow[] = matchingMachineHealthChecks.map((hc: K8sResourceKind) => ({
      model: MachineHealthCheckModel,
      name: hc.metadata?.name,
      namespace: hc.metadata?.namespace,
      scopeDisplay: getMachineHealthCheckScope(hc.spec?.selector, t),
      selectorDisplay: formatHealthCheckSelector(hc.spec?.selector),
      unhealthyConditionsDisplay: formatUnhealthyConditionsDisplay(hc.spec?.unhealthyConditions),
      lastTriggeredTimestamp: hc.status?.lastUpdateTime
        ? new Date(hc.status.lastUpdateTime).toISOString()
        : undefined,
    }));
    const nhcRows: HealthCheckRow[] = matchingNodeHealthChecks.map((nhc) => ({
      model: NodeHealthCheckModel,
      name: nhc.metadata?.name,
      scopeDisplay: getNodeHealthCheckScope(nhc.spec?.selector, t),
      selectorDisplay: formatHealthCheckSelector(nhc.spec?.selector),
      unhealthyConditionsDisplay: formatUnhealthyConditionsDisplay(nhc.spec?.unhealthyConditions),
      lastTriggeredTimestamp: nhc.status?.lastUpdateTime
        ? new Date(nhc.status.lastUpdateTime).toISOString()
        : undefined,
    }));
    return [...mhcRows, ...nhcRows].sort((a, b) => {
      const kindCompare = a.model.kind.localeCompare(b.model.kind);
      if (kindCompare !== 0) {
        return kindCompare;
      }
      return a.name.localeCompare(b.name);
    });
  }, [matchingMachineHealthChecks, matchingNodeHealthChecks, t]);

  return (
    <>
      <Title headingLevel="h3" className="co-section-heading">
        <span>{t('console-app~Machine/Node health checks')}</span>
      </Title>
      {isLoading ? (
        <div className="loading-skeleton--table pf-v6-u-w-100" />
      ) : loadError ? (
        t('console-app~Unable to load health checks')
      ) : (
        <div className="co-table-container">
          <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
            <thead className="pf-v6-c-table__thead">
              <tr className="pf-v6-c-table__tr">
                <th className="pf-v6-c-table__th">{t('console-app~Name')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Scope')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Selector')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Unhealthy conditions')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Last triggered')}</th>
              </tr>
            </thead>
            <tbody className="pf-v6-c-table__tbody">
              {rows.length === 0 ? (
                <tr className="pf-v6-c-table__tr">
                  <td className="pf-v6-c-table__td" colSpan={5}>
                    {t('console-app~No matching MachineHealthChecks or NodeHealthChecks')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    className="pf-v6-c-table__tr"
                    key={`${row.model.id}-${row.namespace ?? ''}-${row.name}`}
                  >
                    <td className="pf-v6-c-table__td">
                      <ResourceLink
                        groupVersionKind={getGroupVersionKindForModel(row.model)}
                        name={row.name}
                        namespace={row.namespace}
                      />
                    </td>
                    <td className="pf-v6-c-table__td pf-v6-u-text-break-word">
                      {row.scopeDisplay}
                    </td>
                    <td className="pf-v6-c-table__td pf-v6-u-text-break-word">
                      {row.selectorDisplay}
                    </td>
                    <td className="pf-v6-c-table__td pf-v6-u-text-break-word">
                      {row.unhealthyConditionsDisplay}
                    </td>
                    <td className="pf-v6-c-table__td">
                      <Timestamp timestamp={row.lastTriggeredTimestamp} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default HealthChecks;
