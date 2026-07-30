import type { FC } from 'react';
import { useCallback } from 'react';
import {
  Bullseye,
  Button,
  ButtonType,
  ButtonVariant,
  Grid,
  GridItem,
  TextInputTypes,
} from '@patternfly/react-core';
import { RhUiMinusCircleIcon } from '@patternfly/react-icons';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { MultiColumnField } from '@console/shared/src/components/formik-fields/multi-column-field/MultiColumnField';
import type { RowRendererProps } from '@console/shared/src/components/formik-fields/multi-column-field/MultiColumnFieldRow';
import ConfigMapDropdown from './ConfigMapDropdown';
import PVCDropdown from './PVCDropdown';
import SecretDropdown from './SecretDropdown';
import { VolumeTypes } from './types';

type VolumeSectionProps = {
  namespace: string;
};

type VolumeFormProps = {
  namePrefix: string;
  onDelete: () => void;
  namespace: string;
};

const GetVolumeTypeFields = (volumeType, namePrefix: string, namespace: string) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const configMap: string = _.get(values, `${namePrefix}.resource`);
  const handleConfigMapChange = useCallback(
    (key) => {
      setFieldValue(`${namePrefix}.resource`, key);
    },
    [namePrefix, setFieldValue],
  );
  switch (volumeType) {
    case VolumeTypes.Secret: {
      return <SecretDropdown name={`${namePrefix}.resource`} namespace={namespace} />;
    }
    case VolumeTypes.ConfigMap: {
      return (
        <ConfigMapDropdown
          name={`${namePrefix}.resource`}
          namespace={namespace}
          isFullWidth
          onChange={handleConfigMapChange}
          selectedKey={configMap}
        />
      );
    }
    case VolumeTypes.EmptyDirectory: {
      return null;
    }
    case VolumeTypes.PVC: {
      return <PVCDropdown name={`${namePrefix}.resource`} namespace={namespace} />;
    }
    default:
      return null;
  }
};

const VolumeForm: FC<VolumeFormProps> = ({ namePrefix, onDelete, namespace }) => {
  const { t } = useTranslation('shipwright-plugin');
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const resourceType: string = _.get(values, `${namePrefix}.resourceType`);
  const volumeTypeOptions: { [type in VolumeTypes]: string } = {
    [VolumeTypes.EmptyDirectory]: t('EmptyDir'),
    [VolumeTypes.ConfigMap]: t('Config Map'),
    [VolumeTypes.Secret]: t('Secret'),
    [VolumeTypes.PVC]: t('PersistentVolumeClaim'),
  };
  return (
    <Grid hasGutter>
      <GridItem span={5}>
        <InputField
          data-test="build-volumeName"
          label="Name"
          name={`${namePrefix}.name`}
          type={TextInputTypes.text}
          placeholder={t('Enter volume name')}
          aria-label="name"
          isDisabled
        />
      </GridItem>
      <GridItem span={6}>
        <div className="form-group">
          <DropdownField
            name={`${namePrefix}.resourceType`}
            label="Volume"
            items={volumeTypeOptions}
            onChange={(type) => {
              setFieldValue(`${namePrefix}.resourceType`, type);
            }}
            fullWidth
          />
          {GetVolumeTypeFields(resourceType, namePrefix, namespace)}
        </div>
      </GridItem>
      <GridItem span={1}>
        <Bullseye>
          <Button
            icon={<RhUiMinusCircleIcon />}
            variant={ButtonVariant.plain}
            type={ButtonType.button}
            onClick={onDelete}
          />
        </Bullseye>
      </GridItem>
    </Grid>
  );
};

const VolumeSection: FC<VolumeSectionProps> = ({ namespace }) => {
  const { t } = useTranslation('shipwright-plugin');
  const { values } = useFormikContext<FormikValues>();
  const { volumes } = values.formData;
  const overridableVolumes = volumes?.filter((volume) => volume.overridable);
  return (
    overridableVolumes?.length > 0 && (
      <MultiColumnField
        data-test="build-volumes"
        name="formData.volumes"
        headers={[]}
        emptyValues={{ name: '', resourceType: '', resourceName: '' }}
        hideAddRow
        rowRenderer={({ onDelete, fieldName }: RowRendererProps) => {
          const volumeOverridable = _.get(values, `${fieldName}.overridable`);
          return (
            volumeOverridable && (
              <FormSection title={t('Volumes')}>
                <VolumeForm namePrefix={fieldName} onDelete={onDelete} namespace={namespace} />
              </FormSection>
            )
          );
        }}
      />
    )
  );
};

export default VolumeSection;
