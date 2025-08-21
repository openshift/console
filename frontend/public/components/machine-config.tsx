import * as _ from 'lodash-es';
import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
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
import { BlueInfoCircleIcon } from '@console/dynamic-plugin-sdk/src';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

import { MachineConfigKind, referenceForModel } from '../module/k8s';
import { MachineConfigModel } from '../models';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  CopyToClipboard,
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';

export const machineConfigReference = referenceForModel(MachineConfigModel);
const machineConfigMenuActions = [
  ...Kebab.getExtensionsActionsForKind(MachineConfigModel),
  ...Kebab.factory.common,
];

const MachineConfigSummary: React.FCC<MachineConfigSummaryProps> = ({ obj, t }) => (
  <ResourceSummary resource={obj}>
    <DescriptionListGroup>
      <DescriptionListTerm>{t('public~OS image URL')}</DescriptionListTerm>
      <DescriptionListDescription>{obj.spec.osImageURL || '-'}</DescriptionListDescription>
    </DescriptionListGroup>
  </ResourceSummary>
);

const MachineConfigDetails: React.FCC<MachineConfigDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const files = obj.spec.config?.storage?.files;

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~MachineConfig details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <MachineConfigSummary obj={obj} t={t} />
          </GridItem>
        </Grid>
      </PaneBody>
      {files && (
        <PaneBody>
          <SectionHeading text={t('public~Configuration files')} />
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
                    headerContent={t('public~Properties')}
                    bodyContent={
                      <DescriptionList isHorizontal isFluid>
                        {file.mode && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('public~Mode')}</DescriptionListTerm>
                            <DescriptionListDescription>{file.mode}</DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        {file.overwrite && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>{t('public~Overwrite')}</DescriptionListTerm>
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
                      aria-label={'public~Info'}
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

export const MachineConfigDetailsPage: React.FCC<any> = (props) => {
  return (
    <DetailsPage
      {...props}
      kind={machineConfigReference}
      menuActions={machineConfigMenuActions}
      pages={pages}
    />
  );
};

const tableColumnClasses = [
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  '',
  Kebab.columnClass,
];

const MachineConfigTableRow: React.FC<RowFunctionArgs<MachineConfigKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={machineConfigReference} name={obj.metadata.name} />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')}>
        {_.get(
          obj,
          [
            'metadata',
            'annotations',
            'machineconfiguration.openshift.io/generated-by-controller-version',
          ],
          '-',
        )}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.get(obj, 'spec.config.ignition.version') || '-'}
      </TableData>
      <TableData className={css(tableColumnClasses[3], 'co-break-word')}>
        {_.get(obj, 'spec.osImageURL') || '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab
          actions={machineConfigMenuActions}
          kind={machineConfigReference}
          resource={obj}
        />
      </TableData>
    </>
  );
};

const MachineConfigList: React.FCC<any> = (props) => {
  const { t } = useTranslation();
  const MachineConfigTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Generated by controller'),
        sortField:
          "metadata.annotations['machineconfiguration.openshift.io/generated-by-controller-version']",
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Ignition version'),
        sortField: 'spec.config.ignition.version',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~OS image URL'),
        sortField: 'spec.osImageURL',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };

  return (
    <Table
      {...props}
      aria-label={t('public~MachineConfigs')}
      Header={MachineConfigTableHeader}
      Row={MachineConfigTableRow}
      virtualize
    />
  );
};

export const MachineConfigPage: React.FCC<any> = ({ canCreate = true, ...rest }) => (
  <ListPage
    {...rest}
    canCreate={canCreate}
    ListComponent={MachineConfigList}
    kind={machineConfigReference}
  />
);

type MachineConfigDetailsProps = {
  obj: MachineConfigKind;
};

type MachineConfigSummaryProps = {
  obj: MachineConfigKind;
  t: TFunction;
};
