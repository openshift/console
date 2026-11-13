import type { FC } from 'react';
import { EmptyState, EmptyStateBody, FormGroup } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { SelectorInput } from '@console/internal/components/utils/selector-input';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import type { PersistentVolumeClaimKind } from '@console/internal/module/k8s';

type PVCTableProps = {
  pvcObjs: PersistentVolumeClaimKind[];
  selectorTags: string[];
  setSelectorTags: (tags: string[]) => void;
  loaded: boolean;
  loadError?: unknown;
};

export const PVCTable: FC<PVCTableProps> = ({
  pvcObjs,
  selectorTags,
  setSelectorTags,
  loaded,
  loadError,
}) => {
  const { t } = useTranslation('console-app');

  const loadErrorMessage = loadError instanceof Error ? loadError.message : (loadError as string);

  return (
    <>
      <FormGroup label={t('Label selector')} fieldId="volume-group-snapshot-labels">
        <SelectorInput onChange={setSelectorTags} tags={selectorTags} options={{ basic: true }} />
      </FormGroup>
      {loadError ? (
        <EmptyState titleText={t('Error loading PVCs')} headingLevel="h4" icon={CubesIcon}>
          <EmptyStateBody>
            {loadErrorMessage ||
              t('There was an error loading the PersistentVolumeClaims. Please try again.')}
          </EmptyStateBody>
        </EmptyState>
      ) : (
        loaded && (
          <>
            <div className="co-table-container">
              <Table aria-label={t('PVCs table')} variant="compact" gridBreakPoint="">
                <Thead>
                  <Tr>
                    <Th>{t('PVC name')}</Th>
                    <Th>{t('Status')}</Th>
                    <Th>{t('Storage class')}</Th>
                    <Th>{t('Volume mode')}</Th>
                    <Th>{t('Requested capacity')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pvcObjs.length > 0 ? (
                    pvcObjs.map((pvc) => (
                      <Tr key={pvc.metadata?.uid}>
                        <Td dataLabel={t('PVC name')}>
                          <ResourceIcon kind={PersistentVolumeClaimModel.kind} />
                          {pvc.metadata?.name}
                        </Td>
                        <Td dataLabel={t('Status')}>{pvc.status?.phase || '-'}</Td>
                        <Td dataLabel={t('Storage class')}>
                          <ResourceIcon kind={StorageClassModel.kind} />
                          {pvc.spec?.storageClassName || '-'}
                        </Td>
                        <Td dataLabel={t('Volume mode')}>{pvc.spec?.volumeMode || '-'}</Td>
                        <Td dataLabel={t('Requested capacity')}>
                          {pvc.spec?.resources?.requests?.storage || '-'}
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={5}>
                        <EmptyState
                          titleText={t('No PVCs have been identified for the volume group yet')}
                          headingLevel="h4"
                          icon={CubesIcon}
                        >
                          <EmptyStateBody>
                            {t(
                              'Use the label selector above to filter and display PVCs that match your criteria. These PVCs will be used to form the volume group.',
                            )}
                          </EmptyStateBody>
                        </EmptyState>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </div>
            {pvcObjs.length > 0 && (
              <p className="pf-v6-u-mt-md">
                {t(
                  '{{count}} PVCs are selected to form the volume group for VolumeGroupSnapshots.',
                  { count: pvcObjs.length },
                )}
              </p>
            )}
          </>
        )
      )}
    </>
  );
};
