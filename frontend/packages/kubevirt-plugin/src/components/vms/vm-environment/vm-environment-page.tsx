import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  AsyncComponent,
  FieldLevelHelp,
  Firehose,
  FirehoseResult,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import {
  ConfigMapModel,
  SecretModel,
  ServiceAccountModel,
  TemplateModel,
} from '@console/internal/models';
import {
  ConfigMapKind,
  EnvVarSource,
  k8sPatch,
  Patch,
  SecretKind,
  ServiceAccountKind,
  TemplateKind,
} from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s/patch';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { VMWrapper } from '../../../k8s/wrapper/vm/vm-wrapper';
import { VirtualMachineModel } from '../../../models';
import { getNamespace } from '../../../selectors';
import { isVM } from '../../../selectors/check-type';
import { getVMLikeModel } from '../../../selectors/vm';
import {
  getTemplateValidationsFromTemplate,
  getVMTemplateNamespacedName,
} from '../../../selectors/vm-template/selectors';
import { V1Disk, V1Volume } from '../../../types/api';
import { VMKind } from '../../../types/vm';
import { getRandomChars, getResource } from '../../../utils';
import { VMTabProps } from '../types';
import {
  configMapKind,
  configMapList,
  configMapRef,
  duplicateSerialsErrorMsg,
  emptySerialErrorMsg,
  secretKind,
  secretList,
  secretRef,
  serialWithoutResourceErrorMsg,
  serviceAccountKind,
  serviceAccountList,
  serviceAccountRef,
} from './constants';
import {
  areEnvDisksEqual,
  areThereDupSerials,
  getAvailableSources,
  getDiskNameBySource,
  getEnvDiskRefKind,
  getNewDiskName,
  getNewEnvVarSource,
  getSerial,
  getSourceKind,
  getSourceName,
  setNewSourceDisk,
  setNewSourceVolume,
  toListObj,
} from './selectors';
import { EnvDisk, NameValuePairs, SOURCES } from './types';
import { VMEnvironmentFooter } from './vm-environment-footer';

import './vm-environment.scss';

export const VMEnvironmentFirehose: React.FC<VMTabProps> = ({
  obj: objProp,
  vm: vmProp,
  customData: { kindObj },
}) => {
  const vm = kindObj === VirtualMachineModel && isVM(objProp) ? objProp : vmProp;
  const resources = [
    getResource(SecretModel, { namespace: getNamespace(vm), prop: 'secretsResource' }),
    getResource(ConfigMapModel, { namespace: getNamespace(vm), prop: 'configmapsResource' }),
    getResource(ServiceAccountModel, {
      namespace: getNamespace(vm),
      prop: 'serviceAccountsResource',
    }),
  ];

  const underlyingTemplate = getVMTemplateNamespacedName(vm);
  if (underlyingTemplate) {
    resources.push({
      kind: TemplateModel.kind,
      model: TemplateModel,
      name: underlyingTemplate.name,
      namespace: underlyingTemplate.namespace,
      isList: false,
      prop: 'templateResource',
    });
  }

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMEnvironment vm={vm} />
      </Firehose>
    </div>
  );
};

const EnvFromEditorComponent = (props) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/utils/name-value-editor').then((c) => c.EnvFromEditor)
    }
    {...props}
  />
);

const emptyEnvDisk = (defaultEnvVar: EnvVarSource): EnvDisk => ['', defaultEnvVar, 0];

/*
This component uses `EnvFromEditor` drap-n-drop list.
The list accepts items of the following format:
[Some-string (string), envVar object (of type EnvVarSource), index (number)]
The format is represented here as 'envDisk'.

Example:
['ATF3O39YMJFGWTQE', configMapRef: { name: 'my-config' }, 4]
*/
const VMEnvironment = withHandlePromise<VMEnvironmentProps>(
  ({
    secretsResource,
    configmapsResource,
    serviceAccountsResource,
    templateResource,
    vm,
    handlePromise,
    inProgress,
    errorMessage,
  }) => {
    const { t } = useTranslation();
    const configMaps = configmapsResource?.data;
    const secrets = secretsResource?.data;
    const serviceAccounts = serviceAccountsResource?.data;
    const template = templateResource?.data;
    const vmWrapper = new VMWrapper(vm);

    const [errMsg, setErrMsg] = React.useState(errorMessage);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const defaultEnvVar: EnvVarSource = {
      configMapSecretRef: { name: t('kubevirt-plugin~Select a resource'), key: '' },
    };

    const getUsedSources = (): EnvDisk[] => {
      let counter = 0;
      const configmapEnvDisks: EnvDisk[] = vmWrapper
        .getConfigMaps()
        .map((cm) => [
          vmWrapper.getDiskSerial(cm.name),
          getNewEnvVarSource(SOURCES.configMapKind, cm.configMap.name),
          counter++,
        ]);

      const secretsEnvDisks: EnvDisk[] = vmWrapper
        .getSecrets()
        .map((s) => [
          vmWrapper.getDiskSerial(s.name),
          getNewEnvVarSource(SOURCES.secretKind, s.secret.secretName),
          counter++,
        ]);

      const serviceAccountEnvDisks: EnvDisk[] = vmWrapper
        .getServiceAccounts()
        .map((sa) => [
          vmWrapper.getDiskSerial(sa.name),
          getNewEnvVarSource(SOURCES.serviceAccountKind, sa.serviceAccount.serviceAccountName),
          counter++,
        ]);

      const usedSources = [...configmapEnvDisks, ...secretsEnvDisks, ...serviceAccountEnvDisks];
      return usedSources.length > 0 ? usedSources : [emptyEnvDisk(defaultEnvVar)];
    };
    const [savedEnvDisks, setSavedEnvDisks] = React.useState(getUsedSources());
    const [envDisks, setEnvDisks] = React.useState(savedEnvDisks);

    const onReload = () => {
      setEnvDisks(getUsedSources());
      setErrMsg('');
      setIsSuccess(false);
    };

    const checkForErrors = () => {
      // Check for empty serials
      const isEmptySerial: EnvDisk = envDisks.find(
        (ed) => getSerial(ed) === '' && getSourceKind(ed),
      );
      if (isEmptySerial) {
        setErrMsg(emptySerialErrorMsg);
        return;
      }
      // Check for duplicate serials:
      const duplicateSerials: boolean = areThereDupSerials(
        envDisks.map((ed) => getSerial(ed)).filter((srl) => srl.length > 0),
      );
      if (duplicateSerials) {
        setErrMsg(duplicateSerialsErrorMsg);
        return;
      }

      if (envDisks.find((ed) => getSerial(ed) && !getSourceName(ed))) {
        setErrMsg(serialWithoutResourceErrorMsg);
        return;
      }
      setErrMsg(null);
    };

    const detectSourceChange = (update: NameValuePairs): EnvDisk => {
      setIsSuccess(false);
      if (!update) {
        return null;
      }

      const newEnvDisks: EnvDisk[] = update.nameValuePairs;

      // Resource was added or removed
      if (newEnvDisks.length !== envDisks.length) {
        return null;
      }

      const zipChange = _.zip(envDisks, newEnvDisks);
      // Get the record that changed
      const inPlaceChange = zipChange.find((pair) => !areEnvDisksEqual(pair[0], pair[1]));
      if (inPlaceChange) {
        const oldEnvDisk: EnvDisk = inPlaceChange[0];
        const newEnvDisk: EnvDisk = inPlaceChange[1];

        // The list had had only 1 record and it was deleted
        if (
          getSerial(newEnvDisk) !== getSerial(oldEnvDisk) &&
          getEnvDiskRefKind(oldEnvDisk) !== getEnvDiskRefKind(newEnvDisk)
        ) {
          return null;
        }

        // Serial has changed
        if (getSerial(newEnvDisk) !== getSerial(oldEnvDisk)) {
          return null;
        }

        // Source has changed - return the changed envDisk
        return newEnvDisk;
      }

      return null;
    };

    // Return true if there was a valid change in at least one of the resources
    const hasValidChange = (newEnvDisks: EnvDisk[]): boolean => {
      if (
        // An edge case were the only saved envDisk is the empty disk
        // and there are no new envDisks
        newEnvDisks.length === 0 &&
        savedEnvDisks.length === 1 &&
        _.isEqual(savedEnvDisks[0], emptyEnvDisk(defaultEnvVar))
      ) {
        return false;
      }

      if (newEnvDisks.length !== savedEnvDisks.length) {
        return true;
      }

      const isNoChange = !!newEnvDisks.every(
        (ed) =>
          !!savedEnvDisks.find(
            (sed) => getSerial(ed) === getSerial(sed) && getSourceName(ed) === getSourceName(sed),
          ),
      );
      return !isNoChange;
    };

    // Save button disable when there is an error or no real change took place
    // e.g no resource was added, removed or modified.
    const isSaveBtnDisabled = (): boolean => {
      const filterdEnvDisks = envDisks.filter((ed) => getSerial(ed) && getSourceName(ed));
      return !hasValidChange(filterdEnvDisks) || !!errMsg;
    };

    const updateEnvDisks = (newEnvDisks: NameValuePairs) => {
      const newEnvDisk: EnvDisk = detectSourceChange(newEnvDisks);

      if (newEnvDisk && newEnvDisk.length > 2) {
        // new envDisk was added
        newEnvDisks.nameValuePairs[newEnvDisk[2]][0] = getRandomChars().toLocaleUpperCase();
      }

      // Update index and capitalize serial number
      for (let i = 0; i < newEnvDisks.nameValuePairs.length; i++) {
        newEnvDisks.nameValuePairs[i][2] = i;
        newEnvDisks.nameValuePairs[i][0] = newEnvDisks.nameValuePairs[i][0].toLocaleUpperCase();
      }

      if (newEnvDisks.nameValuePairs[0].length > 2) {
        setEnvDisks(newEnvDisks.nameValuePairs);
      } else {
        setEnvDisks([emptyEnvDisk(defaultEnvVar)]);
      }
    };

    const onSubmit = async (event) => {
      event.preventDefault();

      // Get all current non-source disks
      const currentOtherDisks: V1Disk[] = vmWrapper
        .getDisks()
        .filter((disk) => !Object.keys(disk).includes('serial'));

      // Get all current non-source volumes
      const currentOtherVolumes: V1Volume[] = vmWrapper
        .getVolumes()
        .filter(
          (vol) =>
            !Object.keys(vol).includes(secretKind) &&
            !Object.keys(vol).includes(configMapKind) &&
            !Object.keys(vol).includes(serviceAccountKind),
        );

      // Evaluate a valid diskBus
      const diskBus: string = getTemplateValidationsFromTemplate(template)
        .getDefaultBus()
        .getValue();

      // construct new volumes and disks lists with the new sources
      let newSourcesDisks: V1Disk[] = [];
      let newSourcesVolumes: V1Volume[] = [];
      envDisks.forEach((ed) => {
        const sourceName = getSourceName(ed);

        if (sourceName) {
          const sourceDiskName =
            getDiskNameBySource(sourceName, vmWrapper) || getNewDiskName(sourceName);
          const newDisk = setNewSourceDisk(sourceDiskName, getSerial(ed), diskBus);
          const newVolume = setNewSourceVolume(getSourceKind(ed), sourceName, sourceDiskName);
          newSourcesDisks = [...newSourcesDisks, newDisk];
          newSourcesVolumes = [...newSourcesVolumes, newVolume];
        }
      });

      newSourcesDisks = [...currentOtherDisks, ...newSourcesDisks];
      newSourcesVolumes = [...currentOtherVolumes, ...newSourcesVolumes];

      const patches: Patch[] = [
        new PatchBuilder('/spec/template/spec/domain/devices/disks')
          .replace(newSourcesDisks)
          .build(),
        new PatchBuilder('/spec/template/spec/volumes').replace(newSourcesVolumes).build(),
      ];

      const promise = k8sPatch(
        getVMLikeModel(vm),
        vm,
        getVMLikePatches(vm, () => patches),
      );

      const filterdEnvDisks = envDisks.filter((ed) => getSerial(ed) && getSourceName(ed));
      handlePromise(
        promise,
        () => {
          setIsSuccess(true);
          setEnvDisks(filterdEnvDisks.length > 0 ? filterdEnvDisks : [emptyEnvDisk(defaultEnvVar)]);
          setSavedEnvDisks(filterdEnvDisks);
        },
        (err) => {
          setIsSuccess(false);
          setErrMsg(err);
        },
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => checkForErrors(), [envDisks]);

    const usedConfigMaps: EnvDisk[] = envDisks.filter(
      (ed) => getEnvDiskRefKind(ed) === configMapRef,
    );
    const usedSecrets: EnvDisk[] = envDisks.filter((ed) => getEnvDiskRefKind(ed) === secretRef);
    const usedServiceAccounts: EnvDisk[] = envDisks.filter(
      (ed) => getEnvDiskRefKind(ed) === serviceAccountRef,
    );

    const availableConfigMaps = configMaps
      ? toListObj(configMapList, getAvailableSources(configMaps, usedConfigMaps))
      : toListObj(configMapList, []);

    const availableSecrets = secrets
      ? toListObj(secretList, getAvailableSources(secrets, usedSecrets))
      : toListObj(secretList, []);

    const availableServiceAccounts = serviceAccounts
      ? toListObj(serviceAccountList, getAvailableSources(serviceAccounts, usedServiceAccounts))
      : toListObj(serviceAccountList, []);

    const addButtonDisabled =
      envDisks.length >= configMaps?.length + secrets?.length + serviceAccounts?.length;

    return (
      <>
        <div className="co-m-pane__body-group">
          <h3 className="co-section-heading-tertiary">
            {t(
              'kubevirt-plugin~Include all values from existing config maps, secrets or service accounts (as Disk)',
            )}
            <FieldLevelHelp>
              {t(
                'kubevirt-plugin~Add new values by referencing an existing config map, secret or service account. Using these values requires mounting them manually to the VM.',
              )}
            </FieldLevelHelp>
          </h3>
          <EnvFromEditorComponent
            nameValueId={0}
            nameValuePairs={envDisks}
            updateParentData={updateEnvDisks}
            configMaps={availableConfigMaps}
            secrets={availableSecrets}
            serviceAccounts={availableServiceAccounts}
            firstTitle={t('kubevirt-plugin~config map / secret / service account')}
            secondTitle={t('kubevirt-plugin~Serial Number')}
            addButtonDisabled={addButtonDisabled || inProgress}
            addButtonLabel={t('kubevirt-plugin~Add Config Map, Secret or Service Account')}
          />
        </div>
        <div className="environment-buttons">
          <VMEnvironmentFooter
            save={onSubmit}
            reload={onReload}
            errorMsg={errMsg}
            isSuccess={isSuccess}
            isSaveBtnDisabled={isSaveBtnDisabled()}
          />
        </div>
      </>
    );
  },
);

type VMEnvironmentProps = HandlePromiseProps & {
  vm: VMKind;
  secretsResource?: FirehoseResult<SecretKind[]>;
  configmapsResource?: FirehoseResult<ConfigMapKind[]>;
  serviceAccountsResource?: FirehoseResult<ServiceAccountKind[]>;
  templateResource?: FirehoseResult<TemplateKind>;
};
