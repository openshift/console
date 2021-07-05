import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ProvisionerProps } from '@console/plugin-sdk';
import { Checkbox } from '@patternfly/react-core';
import { useFlag } from '@console/dynamic-plugin-sdk/src/shared/hooks/flag';

import { GUARDED_FEATURES } from '../../features';

import './ocs-storage-class-form.scss';

export const ThickProvision: React.FC<ProvisionerProps> = ({ parameterKey, onParamChange }) => {
  const { t } = useTranslation();
  const isThickProvisionSupported = useFlag(GUARDED_FEATURES.OCS_THICK_PROVISION);

  const [checked, isChecked] = React.useState(false);

  const setChecked = (value: boolean) => {
    onParamChange(parameterKey, value.toString(), false);
    isChecked(value);
  };

  return (
    isThickProvisionSupported && (
      <div className="ocs-storage-class__form">
        <Checkbox
          id="ocs-sc-thickprovision-checkbox"
          data-test="ocs-sc-thickprovision-checkbox"
          isChecked={checked}
          label={t('ceph-storage-plugin~Enable Thick Provisioning')}
          onChange={setChecked}
        />
        <span className="help-block">
          {t(
            'ceph-storage-plugin~By enabling thick-provisioning, volumes will allocate the requested capacity upon volume creation. Volume creation will be slower when thick-provisioning is enabled.',
          )}
        </span>
      </div>
    )
  );
};
