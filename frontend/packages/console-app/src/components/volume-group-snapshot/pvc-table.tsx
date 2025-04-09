import * as React from 'react';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Label,
  LabelGroup,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon, CubesIcon, PendingIcon } from '@patternfly/react-icons';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { t_global_background_color_secondary_default } from '@patternfly/react-tokens';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { MatchExpression, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { LabelExpressionSelectorModal } from './label-expression-selector/label-expression-selector-modal';

interface PVCTableProps {
  namespace: string;
  pvcObjs: PersistentVolumeClaimKind[];
  labels: { [key: string]: string[] };
  labelExpressions: MatchExpression[];
  setLabelExpressions: (expressions: MatchExpression[]) => void;
  loaded: boolean;
  loadError?: any;
}

export const PVCTable: React.FC<PVCTableProps> = ({
  pvcObjs,
  labels,
  labelExpressions,
  setLabelExpressions,
  loaded,
  loadError,
}) => {
  const { t } = useTranslation();

  const columnNames = {
    name: t('console-app~PVC Name'),
    status: t('console-app~Status'),
    storageClass: t('console-app~Storage class'),
    volumeMode: t('console-app~Volume mode'),
    capacity: t('console-app~Requested capacity'),
  };

  // Display the selected label expressions in a readable format
  const renderLabelExpressions = () => {
    if (!labelExpressions || labelExpressions.length === 0) {
      return null;
    }

    return (
      <div className="pf-v6-u-mt-md pf-v6-u-mb-md">
        <div className="pf-v6-u-mb-xs">
          <strong>{t('console-app~Applied filters:')}</strong>
        </div>
        <LabelGroup>
          {labelExpressions.map((expr) => {
            let labelText;
            switch (expr.operator) {
              case 'In':
                labelText = `${expr.key} in (${(expr.values || []).join(', ')})`;
                break;
              case 'NotIn':
                labelText = `${expr.key} not in (${(expr.values || []).join(', ')})`;
                break;
              case 'Exists':
                labelText = `${expr.key} exists`;
                break;
              case 'DoesNotExist':
                labelText = `${expr.key} does not exist`;
                break;
              default:
                labelText = `${expr.key} ${expr.operator?.toLowerCase() || ''} ${(
                  expr.values || []
                ).join(', ')}`;
            }

            return (
              <Label key={expr.key} icon={<FilterIcon />} color="blue">
                {labelText}
              </Label>
            );
          })}
        </LabelGroup>
      </div>
    );
  };

  if (loadError) {
    return (
      <EmptyState
        titleText={t('console-app~No PVCs have been selected')}
        headingLevel="h4"
        icon={CubesIcon}
      >
        <Title headingLevel="h4" size="lg">
          {t('console-app~Error loading PVCs')}
        </Title>
        <EmptyStateBody>
          {t(
            'console-app~There was an error loading the PersistentVolumeClaims. Please try again.',
          )}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <div className="co-m-pane__body">
      {loaded && renderLabelExpressions()}

      {loaded && labelExpressions.length > 0 && (
        <div className="pf-v6-u-mb-md">
          <LabelExpressionSelectorModal
            labels={labels}
            onSubmit={setLabelExpressions}
            buttonText={t('console-app~Filter PVCs with label selector expressions')}
          />
        </div>
      )}

      {loaded && (
        <>
          <Table aria-label={t('console-app~PVCs table')} variant="compact" borders>
            <Thead>
              <Tr>
                <Th>{columnNames.name}</Th>
                <Th>{columnNames.status}</Th>
                <Th>{columnNames.storageClass}</Th>
                <Th>{columnNames.volumeMode}</Th>
                <Th>{columnNames.capacity}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pvcObjs.length > 0 ? (
                pvcObjs.map((pvc, rowIndex) => {
                  const isOddRow = (rowIndex + 1) % 2;
                  const customStyle = {
                    backgroundColor: t_global_background_color_secondary_default.var,
                  };

                  return (
                    <Tr
                      key={pvc.metadata.uid}
                      className={isOddRow ? 'odd-row-class' : 'even-row-class'}
                      style={isOddRow ? customStyle : {}}
                    >
                      <Td dataLabel={columnNames.name}>
                        <ResourceIcon kind="PersistentVolumeClaim" />
                        {pvc.metadata.name}{' '}
                      </Td>
                      <Td dataLabel={columnNames.status}>
                        <span>
                          {pvc.status.phase === 'Bound' ? (
                            <CheckCircleIcon color="green" />
                          ) : (
                            <PendingIcon />
                          )}
                        </span>{' '}
                        <strong>{pvc.status.phase} </strong>
                      </Td>
                      <Td dataLabel={columnNames.storageClass}>
                        <ResourceIcon kind="StorageClass" />
                        {pvc.spec?.storageClassName || '-'}
                      </Td>
                      <Td dataLabel={columnNames.volumeMode}>{pvc.spec.volumeMode}</Td>
                      <Td dataLabel={columnNames.capacity}>
                        {pvc.spec?.resources?.requests?.storage || '-'}
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={5}>
                    <EmptyState
                      titleText={t(
                        'console-app~No PVCs have been identified for the volume group yet.',
                      )}
                      headingLevel="h4"
                      icon={CubesIcon}
                    >
                      <EmptyStateBody>
                        {t(
                          'console-app~Use the label selector to filter and display PVCs that match your criteria. These PVCs will be used to form the volume group.',
                        )}
                      </EmptyStateBody>
                      <EmptyStateFooter>
                        <EmptyStateActions>
                          <LabelExpressionSelectorModal
                            labels={labels}
                            onSubmit={setLabelExpressions}
                            buttonText={t(
                              'console-app~Filter PVCs with label selector expressions',
                            )}
                          />
                        </EmptyStateActions>
                      </EmptyStateFooter>
                    </EmptyState>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>

          <div className="co-m-pane__body-section pf-v6-u-p-md">
            <span>
              <strong>
                {pvcObjs.length} {t('console-app~PVCs')}
              </strong>{' '}
              {t('console-app~are selected to form volume group for VolumeGroupSnapshots.')}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
