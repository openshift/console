import * as React from 'react';
import { Button, Level, LevelItem, Stack, StackItem } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { RowFunction, TableData, TableRow } from '@console/internal/components/factory';
import {
  FirehoseResult,
  history,
  Kebab,
  LoadingInline,
  ResourceLink,
} from '@console/internal/components/utils';
import { NamespaceModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { PendingStatus } from '@console/shared';
import { SuccessStatus } from '@console/shared/src/components/status/statuses';
import { getTemplateProvider } from '../../../selectors/vm-template/basic';
import { isVMIRunning } from '../../../selectors/vmi';
import { VMIKind, VMKind } from '../../../types';
import { V1alpha1DataVolume } from '../../../types/api';
import { dimensifyRow } from '../../../utils';
import cancelCustomizationModal from '../../modals/template-customization/CancelCustomizationModal';
import { customizeTemplateActions } from '../menu-actions';
import { getTemplateOSIcon } from '../os-icons';
import CustomizeVMTStatus from './CustomizeVMTStatus';
import RowActions from './RowActions';
import { VMTemplateRowProps } from './types';
import { tableColumnClasses } from './utils';

import './vm-template-table.scss';

type VMCustomizeStatusProps = {
  vmis: FirehoseResult<VMIKind[]>;
  vm: VMKind;
  pvcs: PersistentVolumeClaimKind[];
  dataVolumes: V1alpha1DataVolume[];
  pods: PodKind[];
};

const VMCustomizeStatus: React.FC<VMCustomizeStatusProps> = ({
  vmis,
  vm,
  pvcs,
  dataVolumes,
  pods,
}) => {
  const { t } = useTranslation();
  if (!vmis.loaded) {
    return <LoadingInline />;
  }
  const vmi = vmis.data.find(
    (v) => v.metadata.name === vm.metadata.name && v.metadata.namespace === vm.metadata.namespace,
  );

  return isVMIRunning(vmi) ? (
    <SuccessStatus title="Ready for customization">
      <Stack hasGutter>
        <StackItem>
          {t(
            'kubevirt-plugin~Boot source is ready for customization or currently being customized.',
          )}
          <br />{' '}
          {t(
            'kubevirt-plugin~While customizing, this template will not be available for virtual machine creation.',
          )}
        </StackItem>
        <StackItem>
          <Level>
            <LevelItem>
              <Button
                data-test="launch-console"
                variant="link"
                isInline
                onClick={() => {
                  const params = new URLSearchParams();
                  params.append('vm', vm.metadata.name);
                  params.append('vmNs', vm.metadata.namespace);
                  history.push(`/virtualization/customize-source?${params.toString()}`);
                }}
              >
                {t('kubevirt-plugin~Launch console')}
              </Button>
            </LevelItem>
            <LevelItem>
              <Button variant="link" isInline onClick={() => cancelCustomizationModal({ vm })}>
                {t('kubevirt-plugin~Cancel customization')}
              </Button>
            </LevelItem>
          </Level>
        </StackItem>
      </Stack>
    </SuccessStatus>
  ) : (
    <PendingStatus title={t('kubevirt-plugin~Preparing for customization')}>
      <Stack hasGutter>
        <StackItem>
          {t('kubevirt-plugin~Boot source is being prepared for customization.')}
        </StackItem>
        <StackItem>
          <CustomizeVMTStatus vm={vm} vmi={vmi} pods={pods} pvcs={pvcs} dataVolumes={dataVolumes} />
        </StackItem>
      </Stack>
    </PendingStatus>
  );
};

const VMCustomizeRow: RowFunction<{ vm: VMKind; template: TemplateKind }, VMTemplateRowProps> = ({
  obj: { vm, template },
  customData: { namespace, vmis, pvcs, dataVolumes, pods },
  index,
  key,
  style,
}) => {
  const { t } = useTranslation();
  const dimensify = dimensifyRow(tableColumnClasses(!namespace));

  return (
    <TableRow
      className="kv-vm-template__row"
      id={vm.metadata.uid}
      index={index}
      trKey={key}
      style={style}
    >
      <TableData className={dimensify()}>
        <Button
          className={'kv-pin-customize-btn'}
          variant="plain"
          aria-label="pin-templte-action"
          isDisabled
        >
          <StarIcon />
        </Button>
      </TableData>
      <TableData className={dimensify()}>
        <img src={getTemplateOSIcon(template)} alt="" className="kubevirt-vm-template-logo" />
        {template.metadata.name}
      </TableData>
      <TableData data-test="template-provider" className={dimensify()}>
        {getTemplateProvider(t, template)}
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={template.metadata.namespace} />
      </TableData>
      <TableData className={dimensify()} data-test="template-source">
        <VMCustomizeStatus vmis={vmis} vm={vm} pods={pods} pvcs={pvcs} dataVolumes={dataVolumes} />
      </TableData>
      <TableData className={dimensify(true)}>
        <RowActions template={template} sourceStatus={null} namespace={namespace} disableCreate />
      </TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={customizeTemplateActions(vm)}
          key={`kebab-for-${vm.metadata.uid}`}
          id={`kebab-for-${vm.metadata.uid}`}
        />
      </TableData>
    </TableRow>
  );
};

export default VMCustomizeRow;
