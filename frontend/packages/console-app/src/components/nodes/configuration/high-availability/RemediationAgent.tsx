import type { FC } from 'react';
import { useMemo } from 'react';
import { Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { ResourceLink } from '@console/internal/components/utils';
import { MachineHealthCheckModel } from '@console/internal/models';
import type { MachineHealthCheckKind } from '@console/internal/module/k8s';
import { groupVersionFor } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { DASH } from '@console/shared/src/constants';
import type { RemediationTemplateRef } from '../../utils/estimatedRecoveryRemediation';
import { getRemediationTemplateRefsFromHealthCheck } from '../../utils/estimatedRecoveryRemediation';
import type { NodeHealthCheckKind } from '../../utils/HealthCheckUtils';
import { getHealthCheckLastAction, NodeHealthCheckModel } from '../../utils/HealthCheckUtils';

type RemediationAgentRow = {
  typeLabel: string;
  triggeredByModel: typeof MachineHealthCheckModel | typeof NodeHealthCheckModel;
  triggeredByName: string;
  triggeredByNamespace?: string;
  configRef?: RemediationTemplateRef;
  lastAction?: string;
  rowKey: string;
};

type RemediationAgentProps = {
  matchingMachineHealthChecks: MachineHealthCheckKind[];
  matchingNodeHealthChecks: NodeHealthCheckKind[];
  isLoading: boolean;
  loadError?: unknown;
};

const getTemplateTypeLabel = (
  templateKind: string | undefined,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  switch (templateKind) {
    case 'SelfNodeRemediationTemplate':
      return t('console-app~SNR - Self Node Remediation');
    case 'FenceAgentsRemediationTemplate':
      return t('console-app~FAR - Fence Agent Remediation');
    case 'MachineDeletionRemediationTemplate':
    case 'Metal3RemediationTemplate':
      return t('console-app~MDR - Metal3-driven Remediation');
    default:
      return templateKind ?? t('console-app~Unknown remediation');
  }
};

const RemediationAgent: FC<RemediationAgentProps> = ({
  matchingMachineHealthChecks,
  matchingNodeHealthChecks,
  isLoading,
  loadError,
}) => {
  const { t } = useTranslation();

  const rows: RemediationAgentRow[] = useMemo(() => {
    const toRows = (
      healthCheck: MachineHealthCheckKind | NodeHealthCheckKind,
      model: typeof MachineHealthCheckModel | typeof NodeHealthCheckModel,
    ): RemediationAgentRow[] => {
      const templateRefs = getRemediationTemplateRefsFromHealthCheck(healthCheck);
      const lastAction = getHealthCheckLastAction(healthCheck);
      return templateRefs.map((configRef, idx) => ({
        typeLabel: getTemplateTypeLabel(configRef.kind, t),
        triggeredByModel: model,
        triggeredByName: healthCheck.metadata?.name,
        triggeredByNamespace: healthCheck.metadata?.namespace,
        configRef: {
          ...configRef,
          namespace: configRef.namespace ?? healthCheck.metadata?.namespace,
        },
        lastAction,
        rowKey: `${model.id}-${healthCheck.metadata?.namespace ?? ''}-${
          healthCheck.metadata?.name
        }-${configRef.kind ?? ''}-${configRef.name ?? ''}-${idx}`,
      }));
    };

    const machineRows = matchingMachineHealthChecks.flatMap((healthCheck) =>
      toRows(healthCheck, MachineHealthCheckModel),
    );
    const nodeRows = matchingNodeHealthChecks.flatMap((healthCheck) =>
      toRows(healthCheck, NodeHealthCheckModel),
    );

    return [...machineRows, ...nodeRows].sort((a, b) => a.typeLabel.localeCompare(b.typeLabel));
  }, [matchingMachineHealthChecks, matchingNodeHealthChecks, t]);

  return (
    <>
      <Title headingLevel="h3" className="co-section-heading">
        <span>{t('console-app~Node remediation agents')}</span>
      </Title>
      {isLoading ? (
        <div className="loading-skeleton--table pf-v6-u-w-100" />
      ) : loadError ? (
        t('console-app~Unable to load remediation agents')
      ) : (
        <div className="co-table-container">
          <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
            <thead className="pf-v6-c-table__thead">
              <tr className="pf-v6-c-table__tr">
                <th className="pf-v6-c-table__th">{t('console-app~Type')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Triggered by')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Config object')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Last action')}</th>
              </tr>
            </thead>
            <tbody className="pf-v6-c-table__tbody">
              {rows.length === 0 ? (
                <tr className="pf-v6-c-table__tr">
                  <td className="pf-v6-c-table__td" colSpan={4}>
                    {t('console-app~No matching remediation actions')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr className="pf-v6-c-table__tr" key={row.rowKey}>
                    <td className="pf-v6-c-table__td pf-v6-u-text-break-word">{row.typeLabel}</td>
                    <td className="pf-v6-c-table__td">
                      <ResourceLink
                        groupVersionKind={getGroupVersionKindForModel(row.triggeredByModel)}
                        name={row.triggeredByName}
                        namespace={row.triggeredByNamespace}
                      />
                    </td>
                    <td className="pf-v6-c-table__td pf-v6-u-text-break-word">
                      {row.configRef?.name && row.configRef?.apiVersion && row.configRef?.kind ? (
                        <ResourceLink
                          groupVersionKind={{
                            kind: row.configRef.kind,
                            ...groupVersionFor(row.configRef?.apiVersion),
                          }}
                          name={row.configRef.name}
                          namespace={row.configRef.namespace}
                        />
                      ) : (
                        DASH
                      )}
                    </td>
                    <td className="pf-v6-c-table__td">
                      <Timestamp timestamp={row.lastAction} />
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

export default RemediationAgent;
