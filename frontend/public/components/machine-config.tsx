import * as _ from 'lodash-es';
import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
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
  Text,
  TextContent,
} from '@patternfly/react-core';
import { BlueInfoCircleIcon } from '@console/dynamic-plugin-sdk/src';

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
  Timestamp,
} from './utils';
import { ResourceEventStream } from './events';

export const machineConfigReference = referenceForModel(MachineConfigModel);
const machineConfigMenuActions = [
  ...Kebab.getExtensionsActionsForKind(MachineConfigModel),
  ...Kebab.factory.common,
];

const MachineConfigSummary: React.SFC<MachineConfigSummaryProps> = ({ obj, t }) => (
  <ResourceSummary resource={obj}>
    <dt>{t('public~OS image URL')}</dt>
    <dd>{obj.spec.osImageURL || '-'}</dd>
  </ResourceSummary>
);

const MachineConfigDetails: React.SFC<MachineConfigDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const files = obj.spec.config?.storage?.files;

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~MachineConfig details')} />
        <div className="row">
          <div className="col-md-6">
            <MachineConfigSummary obj={obj} t={t} />
          </div>
        </div>
      </div>
      {files && (
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Configuration files')} />
          {files.map((file, i) => (
            <div className="pf-v5-u-mb-xl" key={file.path}>
              <Flex columnGap={{ default: 'columnGapNone' }} className="pf-v5-u-mb-md">
                <TextContent>
                  <Text data-test={`config-file-path-${i}`}>{file.path}</Text>
                </TextContent>
                {(file.mode || file.overwrite) && (
                  <Popover
                    headerContent={t('public~Properties')}
                    bodyContent={
                      <DescriptionList isHorizontal isFluid>
                        <DescriptionListGroup>
                          {file.mode && (
                            <>
                              <DescriptionListTerm>{t('public~Mode')}</DescriptionListTerm>
                              <DescriptionListDescription>{file.mode}</DescriptionListDescription>
                            </>
                          )}
                          {file.overwrite && (
                            <>
                              <DescriptionListTerm>{t('public~Overwrite')}</DescriptionListTerm>
                              <DescriptionListDescription>
                                {file.overwrite.toString()}
                              </DescriptionListDescription>
                            </>
                          )}
                        </DescriptionListGroup>
                      </DescriptionList>
                    }
                  >
                    <Button
                      variant={ButtonVariant.plain}
                      aria-label={'public~Info'}
                      className="pf-v5-u-ml-sm pf-v5-u-p-0"
                    >
                      <BlueInfoCircleIcon />
                    </Button>
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
        </div>
      )}
    </>
  );
};

const pages = [
  navFactory.details(MachineConfigDetails),
  navFactory.editYaml(),
  navFactory.events(ResourceEventStream),
];

export const MachineConfigDetailsPage: React.SFC<any> = (props) => {
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
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
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
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
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

const MachineConfigList: React.SFC<any> = (props) => {
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

export const MachineConfigPage: React.SFC<any> = ({ canCreate = true, ...rest }) => (
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
