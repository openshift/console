import * as React from 'react';
import { Alert, AlertVariant, Checkbox, Text } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

type NetworkTabProps = {
  setCreatingUDN: React.Dispatch<React.SetStateAction<boolean>>;
  setUDNName: React.Dispatch<React.SetStateAction<string>>;
  setUDNSubtnet: React.Dispatch<React.SetStateAction<string>>;
  isCreatingUDN: boolean;
  udnSubnet: string;
  udnName: string;
};

const NetworkTab: React.FC<NetworkTabProps> = ({
  isCreatingUDN,
  udnName,
  udnSubnet,
  setCreatingUDN,
  setUDNName,
  setUDNSubtnet,
}) => {
  const { t } = useTranslation();

  return (
    <div className="create-project-modal__networktab">
      <Alert
        variant={AlertVariant.info}
        isInline
        className="create-project-modal__network-alert"
        title={t(
          'console-shared~Create Primary UserDefinedNetwork to assign VirtualMachines and Pods to communicate over it in this project.',
        )}
      >
        <Text>
          {t(
            'console-shared~This network must be created before you create any workload in this project',
          )}
        </Text>
      </Alert>

      <Checkbox
        label={t('console-shared~Create Primary UserDefinedNetwork')}
        onChange={(_, checked) => setCreatingUDN(checked)}
        isChecked={isCreatingUDN}
        name="create-udn"
        id="create-udn"
        className="form-checkbox"
      />

      {isCreatingUDN && (
        <>
          <div className="form-group">
            <label htmlFor="input-udn-name" className="control-label co-required">
              {t('console-shared~Name')}
            </label>
            <div className="modal-body__field">
              <input
                id="input-udn-name"
                data-test="input-udn-name"
                name="input-udn-name"
                type="text"
                className="pf-v5-c-form-control"
                onChange={(event) => setUDNName(event?.target?.value)}
                value={udnName || ''}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="input-udn-subnet" className="control-label co-required">
              {t('console-shared~Subnet')}
            </label>
            <div className="modal-body__field">
              <input
                id="input-udn-subnet"
                data-test="input-udn-subnet"
                name="input-udn-subnet"
                type="text"
                className="pf-v5-c-form-control"
                onChange={(event) => setUDNSubtnet(event?.target?.value)}
                value={udnSubnet || ''}
                required
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkTab;
