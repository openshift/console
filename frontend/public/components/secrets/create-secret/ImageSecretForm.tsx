import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '../../utils';
import {
  SecretType,
  getImageSecretKey,
  AUTHS_KEY,
  CreateConfigSubform,
  UploadConfigSubform,
} from '.';
import { useCallback, useEffect, useState } from 'react';

export const PullSecretForm: React.FC<PullSecretFormProps> = ({
  onChange,
  onError,
  onFormDisable,
  stringData,
  secretType,
  isCreate,
}) => {
  const [parsedStringData, setParsedStringData] = useState<ParsedStringData>({});
  const [authType, setAuthType] = useState<string>('credentials');
  const { t } = useTranslation();

  useEffect(() => {
    const data = isCreate ? { '.dockerconfigjson': '{}' } : stringData;
    let parsedData;
    try {
      parsedData = _.mapValues(data, JSON.parse);
    } catch (err) {
      onError(`Error parsing secret's data: ${err.message}`);
      parsedData = { '.dockerconfigjson': {} };
    }
    setParsedStringData(parsedData);
  }, [isCreate, stringData, onError]);

  const onDataChanged = useCallback(
    (secretData: StringData) => {
      if (!_.isError(secretData)) {
        onFormDisable(false);
      }
      const newDataKey = secretData[AUTHS_KEY] ? '.dockerconfigjson' : '.dockercfg';
      setParsedStringData({ [newDataKey]: secretData });
      onChange({
        stringData: _.mapValues({ [newDataKey]: secretData }, JSON.stringify),
      });
    },
    [onFormDisable, onchange],
  );

  const handleFormDisable = useCallback(
    (disable: boolean) => {
      onFormDisable(disable);
    },
    [onFormDisable],
  );

  const authTypes = {
    credentials: t('public~Image registry credentials'),
    'config-file': t('public~Upload configuration file'),
  };
  const dataKey = getImageSecretKey(secretType);
  const data = _.get(parsedStringData, dataKey);

  return (
    <>
      {isCreate && (
        <div className="form-group">
          <label className="control-label" htmlFor="secret-type">
            {t('public~Authentication type')}
          </label>
          <div className="co-create-secret__dropdown">
            <Dropdown
              items={authTypes}
              dropDownClassName="dropdown--full-width"
              id="dropdown-selectbox"
              selectedKey={authType}
              onChange={setAuthType}
            />
          </div>
        </div>
      )}
      {authType === 'credentials' ? (
        <CreateConfigSubform onChange={onDataChanged} stringData={data} />
      ) : (
        <UploadConfigSubform
          onChange={onDataChanged}
          stringData={data}
          onDisable={handleFormDisable}
        />
      )}
    </>
  );
};

type StringData = {
  [key: string]: string;
};

type ParsedStringData = {
  [key: string]: StringData;
};

type PullSecretFormProps = {
  onChange: (data: any) => void;
  onError: (message: string) => void;
  onFormDisable: (disable: boolean) => void;
  stringData: StringData;
  secretType: SecretType;
  isCreate: boolean;
};
