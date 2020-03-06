import * as React from 'react';
import * as _ from 'lodash';
import {
  Firehose,
  FieldLevelHelp,
  Dropdown,
  ResourceIcon,
  FirehoseResourcesResult,
  ResourceName,
  LoadingInline,
} from '@console/internal/components/utils';
import { InfrastructureModel } from '@console/internal/models';
import {
  K8sResourceKind,
  StorageClassResourceKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { getInfrastructurePlatform } from '@console/shared';
import { infraProvisionerMap, storageClassTooltip } from '../../constants/ocs-install';
import { isDefaultClass } from '@console/internal/components/storage-class';

const StorageClassDropdownEntry: React.FC<{ sc: FormattedStorageClass }> = ({ sc }) => {
  const storageClassDescriptionLine = _.compact(Object.values(sc)).join(' | ');
  return (
    <span className="co-resource-item">
      <ResourceIcon kind="StorageClass" />
      <span className="co-resource-item__resource-name">
        {sc.name}
        <div className="text-muted small"> {storageClassDescriptionLine}</div>
      </span>
    </span>
  );
};

const getInfraSupportedSC = (
  infra: string,
  storageClasses: StorageClassResourceKind[],
): StorageClassResourceKind[] =>
  _.filter(storageClasses, (sc) => sc.provisioner === infraProvisionerMap[_.toLower(infra)]);

const buildFormattedSCData = (formattedSC: SCMap, sc: StorageClassResourceKind) => {
  const scName = sc?.metadata?.name;
  formattedSC[scName] = {
    default: isDefaultClass(sc) ? '(default)' : '',
    provisioner: sc.provisioner,
    name: scName,
  };
  return formattedSC;
};

const getSCMap = (filteredSC: StorageClassResourceKind[]): SCMap => {
  const sortedData = {};
  const data: SCMap = filteredSC.reduce(buildFormattedSCData, {});
  Object.keys(data)
    .sort()
    .forEach((key) => (sortedData[key] = data[key]));
  return sortedData;
};

const getDropdownItems = (data: SCMap): DropdownItems =>
  Object.keys(data).reduce((items: DropdownItems, key: string) => {
    items[key] = <StorageClassDropdownEntry sc={data[key]} />;
    return items;
  }, {});

export const OCSStorageClassDropdownInner: React.FC<OCSStorageClassDropdownInnerProps> = ({
  resources,
  onChange,
  selectedKey,
}) => {
  let ocsSCDropdownItems: DropdownItems = {};
  let title: React.ReactNode;
  const infra = _.get(resources, 'infra');
  const storageClasses = _.get(resources, 'storageClass');

  const infraData = _.get(infra, 'data') as K8sResourceKind;
  const infraLoaded = _.get(infra, 'loaded');
  const infraLoadError = _.get(infra, 'loadError');

  const scData = _.get(storageClasses, 'data', []) as StorageClassResourceKind[];
  const scLoaded = _.get(storageClasses, 'loaded');
  const scLoadError = _.get(storageClasses, 'loadError');
  const infraPlatform: string = getInfrastructurePlatform(infraData);

  if (scLoadError || infraLoadError) title = <div className="cos-error-title">Error Loading </div>;
  else if (!infraLoaded && !scLoaded) title = <LoadingInline />;
  else {
    const filteredSC: StorageClassResourceKind[] = getInfraSupportedSC(infraPlatform, scData);
    const scMap: SCMap = getSCMap(filteredSC);
    const defaultClass: string = _.findKey(scMap, 'default');

    ocsSCDropdownItems = getDropdownItems(scMap);
    title = <ResourceName kind="StorageClass" name={selectedKey} />;

    if (!selectedKey && defaultClass) {
      onChange(defaultClass);
    }
    if (!defaultClass && !selectedKey) {
      title = <span className="text-muted">Select storage class</span>;
    }
  }

  return (
    <>
      <label className="control-label" htmlFor="storageClass">
        Storage Class
        <FieldLevelHelp>{storageClassTooltip}</FieldLevelHelp>
      </label>
      <Dropdown
        className="co-storage-class-dropdown"
        dropDownClassName="dropdown--full-width"
        autocompletePlaceholder="Select storage class"
        items={ocsSCDropdownItems}
        selectedKey={selectedKey}
        title={title}
        onChange={onChange}
        noSelection
        menuClassName="dropdown-menu--text-wrap"
      />
    </>
  );
};

export const OCSStorageClassDropdown: React.FC<OCSStorageClassDropdownProps> = (props) => (
  <Firehose
    resources={[
      { kind: 'StorageClass', prop: 'storageClass', isList: true },
      {
        kind: referenceForModel(InfrastructureModel),
        prop: 'infra',
        name: 'cluster',
      },
    ]}
  >
    <OCSStorageClassDropdownInner {...props} />
  </Firehose>
);

type OCSStorageClassDropdownProps = {
  onChange: React.Dispatch<React.SetStateAction<string>>;
  selectedKey?: string;
};

type OCSStorageClassDropdownInnerProps = {
  onChange: React.Dispatch<React.SetStateAction<string>>;
  resources?: FirehoseResourcesResult;
  selectedKey?: string;
};

type DropdownItems = {
  [key: string]: React.ReactNode;
};

type FormattedStorageClass = {
  default: string;
  provisioner: string;
  name: string;
};

type SCMap = { [key: string]: FormattedStorageClass };
