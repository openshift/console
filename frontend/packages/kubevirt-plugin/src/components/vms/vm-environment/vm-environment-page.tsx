import * as React from 'react';
import { VMKind } from '../../../types/vm';
import {
  SecretKind,
  ConfigMapKind,
  EnvVarSource,
  TemplateKind,
  k8sPatch,
  Patch,
  ServiceAccountKind,
} from '@console/internal/module/k8s';
import { getNamespace } from '@console/shared';
import { getResource } from '../../../utils';
import {
  SecretModel,
  ConfigMapModel,
  ServiceAccountModel,
  TemplateModel,
} from '@console/internal/models';
import {
  Firehose,
  FirehoseResult,
  FieldLevelHelp,
  AsyncComponent,
  HandlePromiseProps,
  withHandlePromise,
} from '@console/internal/components/utils';
import { VMTabProps } from '../types';
import { isVM, getVMLikeModel } from '../../../selectors/vm';
import * as _ from 'lodash';
import {
  areEnvDisksEqual,
  getEnvDiskRefKind,
  getAvailableSources,
  getNewEnvVarSource,
  toListObj,
  getSourceName,
  getNewDiskName,
  setNewSourceDisk,
  getSourceKind,
  getSerialNumber,
  setNewSourceVolume,
  areThereDupSerials,
  getSerial,
  getEnvVarSource,
} from './selectors';
import { SOURCES, EnvDisk, NameValuePairs } from './types';
import { VMWrapper } from '../../../k8s/wrapper/vm/vm-wrapper';
import {
  configMapList,
  secretList,
  serviceAccountList,
  secretKind,
  configMapKind,
  serviceAccountKind,
  configMapRef,
  secretRef,
  serviceAccountRef,
  duplicateSerialsErrorMsg,
  emptySerialErrorMsg,
} from './constants';
import { VMEnvironmentFooter } from './vm-environment-footer';
import './vm-environment.scss';
import {
  getTemplateValidationsFromTemplate,
  getVMTemplateNamespacedName,
} from '../../../selectors/vm-template/selectors';
import { PatchBuilder } from '@console/shared/src/k8s/patch';
import { getVMLikePatches } from '../../../k8s/patches/vm-template';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { VirtualMachineModel } from '../../../models';
import { V1Disk } from '../../../types/vm/disk/V1Disk';

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

const defaultEnvVar: EnvVarSource = {
  configMapSecretRef: { name: 'Select a resource', key: '' },
};
const emptyEnvDisk: EnvDisk = ['', defaultEnvVar, 0];

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
    const configMaps = configmapsResource?.data;
    const secrets = secretsResource?.data;
    const serviceAccounts = serviceAccountsResource?.data;
    const template = templateResource?.data;
    const vmWrapper = new VMWrapper(vm);

    const [errMsg, setErrMsg] = React.useState(errorMessage);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const setUsedSources = (isReload: boolean = false): EnvDisk[] => {
      let counter = 0;
      if (isReload) {
        setErrMsg('');
        setIsSuccess(false);
      }
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
      return usedSources.length > 0 ? usedSources : [emptyEnvDisk];
    };

    const [envDisks, setEnvDisks] = React.useState(setUsedSources());

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onReload = React.useCallback(() => setEnvDisks(setUsedSources(true)), []);

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

    const updateEnvDisks = (newEnvDisks: NameValuePairs) => {
      const newEnvDisk: EnvDisk = detectSourceChange(newEnvDisks);

      if (newEnvDisk) {
        // new envDisk was added
        newEnvDisks.nameValuePairs[newEnvDisk[2]][0] = getSerialNumber();
      }

      // Update index
      for (let i = 0; i < newEnvDisks.nameValuePairs.length; i++) {
        newEnvDisks.nameValuePairs[i][2] = i;
      }

      if (newEnvDisks.nameValuePairs[0].length > 2) {
        setEnvDisks(newEnvDisks.nameValuePairs);
      } else {
        setEnvDisks([emptyEnvDisk]);
      }
    };

    const onSubmit = async (event) => {
      event.preventDefault();

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
      setErrMsg('');

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
        const sourceName = getSourceName(getEnvVarSource(ed));

        if (sourceName) {
          const sourceDiskName = getNewDiskName(sourceName);
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

      handlePromise(promise)
        .then(() => {
          setIsSuccess(true);
          setEnvDisks(envDisks.filter((ed) => getSerial(ed)));
        })
        .catch((err) => {
          setIsSuccess(false);
          setErrMsg(err);
        });
    };

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
            Include all values from existing config maps, secrets or service accounts (as Disk)
            <FieldLevelHelp>
              Add new values by referencing an existing config map, secret or service account. Using
              these values requires mounting them manually to the VM.
            </FieldLevelHelp>
          </h3>
          <EnvFromEditorComponent
            nameValueId={0}
            nameValuePairs={envDisks}
            updateParentData={updateEnvDisks}
            readOnly={false}
            configMaps={availableConfigMaps}
            secrets={availableSecrets}
            serviceAccounts={availableServiceAccounts}
            firstTitle="configmap / secret / service account"
            secondTitle="Serial Number"
            addButtonDisabled={addButtonDisabled || inProgress}
          />
        </div>
        <div className="environment-buttons">
          <VMEnvironmentFooter
            save={onSubmit}
            reload={onReload}
            errorMsg={errMsg}
            isSuccess={isSuccess}
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
