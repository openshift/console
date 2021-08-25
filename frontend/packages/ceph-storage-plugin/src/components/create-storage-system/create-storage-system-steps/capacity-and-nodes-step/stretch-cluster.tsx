import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  Alert,
  Checkbox,
  Select,
  SelectVariant,
  SelectOption,
  TextContent,
  TextVariants,
  Text,
  SelectProps,
} from '@patternfly/react-core';

import { arbiterText } from '../../../../constants';
import { WizardState } from '../../reducer';
import { EnableArbiterLabel } from '../../../ocs-install/install-wizard/capacity-and-nodes';

const HelperText: React.FC<{ enableArbiter: boolean }> = ({ enableArbiter }) => {
  const { t } = useTranslation();
  return (
    <>
      <TextContent>
        <Text component={TextVariants.small}>
          {t(
            'ceph-storage-plugin~To support high availability when two data centers can be used, enable arbiter to get a valid quorum between the two data centers.',
          )}
        </Text>
      </TextContent>
      {enableArbiter && (
        <Alert
          aria-label={t('ceph-storage-plugin~Arbiter minimum requirements')}
          title={t('ceph-storage-plugin~Arbiter minimum requirements')}
          variant="info"
          isInline
        >
          {arbiterText(t)}
        </Alert>
      )}
    </>
  );
};

export const StretchCluster: React.FC<StretchClusterProps> = ({
  onSelect,
  onChecked,
  zones,
  enableArbiter,
  arbiterLocation,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{t('ceph-storage-plugin~Stretch Cluster')}</Text>
      </TextContent>
      <Checkbox
        aria-label={t('ceph-storage-plugin~Enable arbiter')}
        id="stretch-cluster"
        isChecked={enableArbiter}
        label={<EnableArbiterLabel />}
        description={<HelperText enableArbiter={enableArbiter} />}
        onChange={(hasChecked: boolean) => {
          if (!hasChecked) onSelect(null, '');
          onChecked(hasChecked);
        }}
        body={
          enableArbiter && (
            <FormGroup
              label={t('ceph-storage-plugin~Arbiter zone')}
              fieldId="arbiter-zone-selection"
              helperText={t(
                'ceph-storage-plugin~An arbiter node will be automatically selected from this zone',
              )}
            >
              <Select
                variant={SelectVariant.single}
                placeholderText={t('ceph-storage-plugin~Select an arbiter zone')}
                aria-label={t('ceph-storage-plugin~Arbiter zone selection')}
                onToggle={(value: boolean) => setIsOpen(value)}
                onSelect={onSelect}
                selections={arbiterLocation}
                isOpen={isOpen}
                id="arbiter-zone-selection"
              >
                {zones.map((zone) => (
                  <SelectOption key={zone} value={zone} />
                ))}
              </Select>
            </FormGroup>
          )
        }
      />
    </>
  );
};

type StretchClusterProps = {
  onSelect: SelectProps['onSelect'];
  onChecked: (isChecked: boolean) => void;
  arbiterLocation: WizardState['capacityAndNodes']['arbiterLocation'];
  enableArbiter: WizardState['capacityAndNodes']['enableArbiter'];
  zones: string[];
};
