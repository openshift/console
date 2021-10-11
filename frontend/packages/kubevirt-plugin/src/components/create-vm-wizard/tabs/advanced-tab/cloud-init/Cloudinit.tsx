import * as React from 'react';
import yamlParser from 'js-yaml';
import { isEmpty, isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux';
import useCloudinitValidations from '../../../../../hooks/use-cloudinit-validations';
import useSSHKeys from '../../../../../hooks/use-ssh-keys';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
} from '../../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { iGetIn, toShallowJS } from '../../../../../utils/immutable';
import FormWithEditor, {
  EditorPosition,
  FieldsMapper,
  ViewComponent,
} from '../../../../form-with-editor/FormWithEditor';
import { iGetCloudInitNoCloudStorage } from '../../../selectors/immutable/storage';
import { cloudinitFormChildren } from './CloudinitForm';
import CloudinitFormOrYamlSelector from './CloudinitFormOrYamlSelector';
import CloudInitInfoHelper from './CloudinitInfoHelper';
import { onDataChanged } from './utils/cloudinit-utils';
import './cloud-init.scss';

const fieldsMapper: FieldsMapper = {
  'cloudint-password': { path: 'password' },
  'cloudint-user': { path: 'user' },
  'cloudint-hostname': { path: 'hostname' },
  '^cloudint-ssh_authorized_keys-key-[0-9]*$': {
    path: 'ssh_authorized_keys',
    isArray: true,
  },
};

type CloudinitProps = {
  wizardReduxID: string;
};

const Cloudinit: React.FC<CloudinitProps> = ({ wizardReduxID }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { iCloudInitStorage } = useSelector((state: RootStateOrAny) => ({
    iCloudInitStorage: iGetCloudInitNoCloudStorage(state, wizardReduxID),
  }));

  const [data, isBase64] = CloudInitDataHelper.getUserData(
    toShallowJS(iGetIn(iCloudInitStorage, ['volume', 'cloudInitNoCloud'])),
  );

  const dataSSHKeys = React.useMemo(() => new CloudInitDataHelper({ userData: data }), [data]);
  const { tempSSHKey } = useSSHKeys();
  const authKeysData = React.useMemo(
    () => dataSSHKeys.get(CloudInitDataFormKeys.SSH_AUTHORIZED_KEYS) || [tempSSHKey || ''],
    [dataSSHKeys, tempSSHKey],
  );

  const [yaml, setYaml] = React.useState<string>();
  const [yamlAsJS, setYamlAsJS] = React.useState<{ [key: string]: any }>();
  const [view, setView] = React.useState<ViewComponent>(ViewComponent.form);
  const [isYamlValid, setIsYamlValid] = React.useState<boolean>(true);

  const [authKeys, setAuthKeys] = React.useState<string[]>(authKeysData);

  const { validationSchema, validationStatus, isValid } = useCloudinitValidations(wizardReduxID);

  React.useEffect(() => {
    data && !yaml && setYaml(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  React.useEffect(() => {
    validationSchema(yamlAsJS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yamlAsJS]);

  React.useEffect(() => {
    if (!isEmpty(yamlAsJS) && !isEmpty(yaml) && !isEqual(yamlAsJS?.ssh_authorized_keys, authKeys)) {
      setYaml(
        yamlParser.dump({
          ...yamlParser.load(yaml),
          ...yamlAsJS,
          /* eslint-disable-next-line @typescript-eslint/camelcase */
          ssh_authorized_keys: authKeys,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authKeys]);

  React.useEffect(() => {
    yaml &&
      isValid &&
      isYamlValid &&
      onDataChanged(yaml, isBase64, iCloudInitStorage, wizardReduxID, dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, yaml, isYamlValid]);

  const onChange = React.useCallback(
    (yamlData, yamlAsJSData) => {
      yamlAsJSData && setYamlAsJS(yamlAsJSData);
      yamlData &&
        setYaml(
          yamlParser.dump({
            ...yamlParser.load(yamlData),
            /* eslint-disable-next-line @typescript-eslint/camelcase */
            ssh_authorized_keys: yamlAsJSData?.ssh_authorized_keys || authKeys,
          }),
        );
      setAuthKeys(yamlAsJSData?.ssh_authorized_keys);
    },
    [setYaml, setYamlAsJS, authKeys],
  );

  return (
    <>
      <div className="kv-cloudinit-advanced-tab-with-editor--title_main">
        <CloudinitFormOrYamlSelector view={view} setView={setView} />
      </div>
      <CloudInitInfoHelper />
      <div className="kv-cloudinit-advanced-tab-with-editor--main">
        <FormWithEditor
          data={yaml}
          onChange={onChange}
          fieldsMapper={fieldsMapper}
          editorPosition={EditorPosition.left}
          classNameForm="kv-cloudinit-advanced-tab-with-editor--form"
          view={view}
          alertTitle={t('kubevirt-plugin~Yaml structure is broken')}
          setIsYamlValid={setIsYamlValid}
        >
          {cloudinitFormChildren({ authKeys, setAuthKeys, validationStatus })}
        </FormWithEditor>
      </div>
    </>
  );
};

export default Cloudinit;
