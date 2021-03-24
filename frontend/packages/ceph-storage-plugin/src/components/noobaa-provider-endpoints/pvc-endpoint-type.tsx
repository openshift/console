import { useTranslation } from 'react-i18next';
import * as React from 'react';
import { FormGroup, InputGroupText, TextInput, InputGroup } from '@patternfly/react-core';
import { MinusIcon, PlusIcon } from '@patternfly/react-icons';
import { RequestSizeInput } from '@console/internal/components/utils';
import { getName, isObjectSC } from '@console/shared';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { StorageClass } from '@console/internal/components/storage-class-form';
import {
  BackingStoreProviderDataState,
  BackingStoreAction,
} from '../create-backingstore-page/reducer';
import './noobaa-provider-endpoints.scss';

type PVCTypeProps = {
  state: BackingStoreProviderDataState;
  dispatch: React.Dispatch<BackingStoreAction>;
};

export const PVCType: React.FC<PVCTypeProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();

  const [size, setSize] = React.useState('50');
  const [, updateState] = React.useState();
  const units = {
    GiB: 'GiB',
    TiB: 'TiB',
  };

  // Noobaa expected Ti console standrad is to show TiB
  const unitConverter = {
    GiB: 'Gi',
    TiB: 'Ti',
  };

  // Fix for updating the storage class by force rerender
  const forceUpdate = React.useCallback(() => updateState({}), []);

  React.useEffect(() => {
    forceUpdate();
  }, [forceUpdate, state.storageClass]);

  const onChange = (event) => {
    const { value, unit } = event;
    const input = `${value}${unitConverter[unit]}`;
    setSize(value);
    dispatch({ type: 'setVolumeSize', value: input });
  };

  const substract = () => {
    if (state.numVolumes > 1) {
      dispatch({ type: 'setVolumes', value: state.numVolumes - 1 });
    }
  };

  const onlyPvcSCs = React.useCallback((sc: StorageClass) => !isObjectSC(sc), []);

  return (
    <>
      <FormGroup
        label={t('ceph-storage-plugin~Number of Volumes')}
        fieldId="set-volumes"
        className="nb-endpoints-form-entry nb-endpoints-form-entry--short"
        isRequired
      >
        <InputGroup>
          <InputGroupText>
            <MinusIcon onClick={substract} />{' '}
          </InputGroupText>
          <TextInput
            value={state.numVolumes}
            aria-label={t('ceph-storage-plugin~Number of Volumes')}
          />
          <InputGroupText>
            <PlusIcon
              onClick={() => dispatch({ type: 'setVolumes', value: state.numVolumes + 1 })}
            />{' '}
          </InputGroupText>
        </InputGroup>
      </FormGroup>
      <FormGroup
        label={t('ceph-storage-plugin~Volume Size')}
        fieldId="volume-size"
        className="nb-endpoints-form-entry nb-endpoints-form-entry--short"
        isRequired
      >
        <RequestSizeInput
          name={t('ceph-storage-plugin~Volume Size')}
          onChange={onChange}
          dropdownUnits={units}
          defaultRequestSizeUnit="GiB"
          defaultRequestSizeValue={size}
        />
      </FormGroup>
      <FormGroup fieldId="storage-class" className="nb-endpoints-form-entry" isRequired>
        <StorageClassDropdown
          onChange={(sc) => dispatch({ type: 'setStorageClass', value: getName(sc) })}
          defaultClass="ocs-storagecluster-ceph-rbd"
          id="sc-dropdown"
          filter={onlyPvcSCs}
          required
        />
      </FormGroup>
    </>
  );
};
