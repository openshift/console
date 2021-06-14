import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { winToolsContainerNames } from '../../constants/vm/wintools';
import {
  getContainerImageByDisk,
  getPVCSourceByDisk,
  getURLSourceByDisk,
} from '../../selectors/vm/selectors';
import { VMKind } from '../../types';
import { V1Disk } from '../../types/api';

import './disk-summary.scss';

export const DiskSummary: React.FC<DiskSummaryProps> = ({ disks, vm }) => {
  const { t } = useTranslation();

  return (
    <dl className="kubevirt-disk-summary">
      {disks.map(({ name }) => {
        const container = getContainerImageByDisk(vm, name);
        const pvc = getPVCSourceByDisk(vm, name);
        const url = getURLSourceByDisk(vm, name);
        const nameKey = `kubevirt-disk-summary-disk-title-${name}`;
        let value = '';
        const containerNames = winToolsContainerNames();
        if (_.includes(containerNames, container)) {
          value = t('kubevirt-plugin~Windows tools: {{container}}', { container });
        } else if (container) {
          value = t('kubevirt-plugin~Container: {{container}}', { container });
        } else if (url) {
          value = t('kubevirt-plugin~URL: {{url}}', { url });
        } else if (pvc) {
          value = t('kubevirt-plugin~PVC: {{ pvc }}', { pvc });
        }

        return (
          <React.Fragment key={nameKey}>
            <dt id={nameKey} key={nameKey} className="kubevirt-disk-summary__datalist-dt">
              {name}
            </dt>
            <dd
              id={`${nameKey}-info`}
              key={`${nameKey}-info`}
              className="kubevirt-disk-summary__datalist-dd"
            >
              {value}
            </dd>
          </React.Fragment>
        );
      })}
    </dl>
  );
};

type DiskSummaryProps = {
  vm: VMKind;
  disks: V1Disk[];
};
