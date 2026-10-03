import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import {
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Popover,
  Content,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import type { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import { BlueInfoCircleIcon } from '@console/dynamic-plugin-sdk';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { MachineConfigModel } from '../models';
import type { MachineConfigKind } from '../module/k8s';
import { referenceForModel } from '../module/k8s';
import { ResourceEventStream } from './events';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import { CopyToClipboard } from './utils/copy-to-clipboard';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink } from './utils/resource-link';
import { LoadingBox } from './utils/status-box';

export const machineConfigReference = referenceForModel(MachineConfigModel);

const MachineConfigSummary: FC<MachineConfigSummaryProps> = ({ obj, t }) => (
  <ResourceSummary resource={obj}>
    <DescriptionListGroup>
      <DescriptionListTerm>{t('OS image URL')}</DescriptionListTerm>
      <DescriptionListDescription>{obj.spec.osImageURL || DASH}</DescriptionListDescription>
    </DescriptionListGroup>
  </ResourceSummary>
);

const MachineConfigDetails: FC<MachineConfigDetailsProps> = ({ obj }) => {
  const { t } = useTranslation('public');
  const files = obj.spec.config?.storage?.files;

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('MachineConfig details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <MachineConfigSummary obj={obj} t={t} />
          </GridItem>
        </Grid>
      </PaneBody>
      {files && (
        <PaneBody>
          <SectionHeading text={t('Configuration files')} />
          {files.map((file, i) => (
            <div className="pf-v6-u-mb-xl" key={file.path}>
              <Flex columnGap={{ default: 'columnGapNone' }} className="pf-v6-u-mb-md">
                <Content>
                  <Content component="p" data-test={`config-file-path-${i}`}>
                    {file.path}
                  </Content>
                </Content>
                {(file.mode || file.overwrite) && (
                  <Popover
                    headerContent={t('Properties')}
                    bodyContent={
                      <DescriptionList isHorizontal isFluid>
                        {file.mode && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Mode')}</DescriptionListTerm>
                            <DescriptionListDescription>{file.mode}</DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        {file.overwrite && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('Overwrite')}</DescriptionListTerm>
                            <DescriptionListDescription>
                              {file.overwrite.toString()}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                      </DescriptionList>
                    }
                  >
                    <Button
                      icon={<BlueInfoCircleIcon />}
                      variant={ButtonVariant.plain}
                      aria-label={t('Info')}
                      className="pf-v6-u-ml-sm pf-v6-u-p-0"
                    />
                  </Popover>
                )}
              </Flex>
              {file.contents?.source && (
                <CopyToClipboard
                  value={decodeURIComponent(file.contents.source).replace(/^(data:,)/, '')}
                />
              )}
            </div>
          ))}
        </PaneBody>
      )}
    </>
  );
};

const pages = [
  navFactory.details(MachineConfigDetails),
  navFactory.editYaml(),
  navFactory.events(ResourceEventStream),
];

export const MachineConfigDetailsPage: FC<any> = (props) => (
  <DetailsPage {...props} kind={machineConfigReference} pages={pages} />
);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'generatedByController' },
  { id: 'ignitionVersion' },
  { id: 'osImageURL' },
  { id: 'created' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<MachineConfigKind> = (data, columns) =>
  data.map(({ obj }) => {
    const { name } = obj.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={machineConfigReference} name={name} />,
      },
      [tableColumnInfo[1].id]: {
        cell: _.get(
          obj,
          [
            'metadata',
            'annotations',
            'machineconfiguration.openshift.io/generated-by-controller-version',
          ],
          DASH,
        ),
        props: {
          modifier: 'breakWord',
        },
      },
      [tableColumnInfo[2].id]: {
        cell: _.get(obj, 'spec.config.ignition.version') || DASH,
      },
      [tableColumnInfo[3].id]: {
        cell: _.get(obj, 'spec.osImageURL') || DASH,
        props: {
          modifier: 'breakWord',
        },
      },
      [tableColumnInfo[4].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <LazyActionMenu context={{ [machineConfigReference]: obj }} />,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });

const useMachineConfigColumns = (): {
  columns: ConsoleDataViewColumn<MachineConfigKind>[];
} => {
  const { t } = useTranslation('public');

  const columns: ConsoleDataViewColumn<MachineConfigKind>[] = useMemo(
    () => [
      {
        type: 'name' as const,
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Generated by controller'),
        id: tableColumnInfo[1].id,
        sort: "metadata.annotations['machineconfiguration.openshift.io/generated-by-controller-version']",
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Ignition version'),
        id: tableColumnInfo[2].id,
        sort: 'spec.config.ignition.version',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('OS image URL'),
        id: tableColumnInfo[3].id,
        sort: 'spec.osImageURL',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Created'),
        id: tableColumnInfo[4].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      { type: 'actions' as const, id: tableColumnInfo[5].id },
    ],
    [t],
  );

  return { columns };
};

const MachineConfigList: FC<MachineConfigListProps> = ({ data, loaded, loadError, ...props }) => {
  const { columns } = useMachineConfigColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<MachineConfigKind>
        {...props}
        id={MachineConfigModel}
        label={MachineConfigModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
      />
    </Suspense>
  );
};

export const MachineConfigPage: FC<any> = ({ canCreate = true, ...rest }) => (
  <ListPage
    {...rest}
    canCreate={canCreate}
    ListComponent={MachineConfigList}
    kind={machineConfigReference}
    omitFilterToolbar
  />
);

type MachineConfigDetailsProps = {
  obj: MachineConfigKind;
};

type MachineConfigSummaryProps = {
  obj: MachineConfigKind;
  t: TFunction;
};

type MachineConfigListProps = {
  data: MachineConfigKind[];
  loaded: boolean;
  loadError?: any;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
};
