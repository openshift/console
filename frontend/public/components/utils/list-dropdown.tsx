import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { Alert } from '@patternfly/react-core';
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAGS } from '@console/shared/src/constants';
import { ActionItem, ConsoleSelect } from './dropdown';
import { Firehose } from './firehose';
import { LoadingInline } from './status-box';
import { ResourceName } from './resource-icon';
import { flagPending } from '../../reducers/features';
import { NamespaceModel, ProjectModel } from '@console/internal/models';
import { useTranslation } from 'react-i18next';
import { useCreateNamespaceModal } from '@console/shared/src/hooks/useCreateNamespaceModal';
import { useCreateProjectModal } from '@console/shared/src/hooks/useCreateProjectModal';
import {
  FirehoseResource,
  K8sResourceCommon,
  K8sModel,
  K8sResourceKind,
} from '@console/dynamic-plugin-sdk/src';

const getKey = (key, keyKind) => {
  return keyKind ? `${key}-${keyKind}` : key;
};

interface ListDropdownResource extends Partial<FirehoseResource> {
  data?: K8sResourceCommon[];
}

export interface ListDropdownProps {
  dataFilter?: (resource: K8sResourceCommon) => boolean;
  desc?: string;
  // specify both key/kind
  selectedKey?: string;
  selectedKeyKind?: string;
  fixed?: boolean;
  resources?: ListDropdownResource[];
  placeholder?: string;
  onChange: (
    selectedKey: string,
    selectedKeyKind?: string,
    selectedResource?: K8sResourceKind,
  ) => void;
  id?: string;
  disabled?: boolean;

  dataTest?: string;
  actionItems?: ActionItem[];
  loaded?: boolean;
  loadError?: boolean;
}

const ListDropdown_: React.FCC<ListDropdownProps> = ({
  desc,
  placeholder,
  loaded,
  loadError,
  resources,
  dataFilter,
  fixed,
  id,
  disabled,
  actionItems,
  dataTest,
  onChange,
  ...props
}) => {
  const { t } = useTranslation();
  const [items, setItems] = React.useState<{
    [key: string]: { kindLabel: string; name: string; resource: K8sResourceKind };
  }>({});
  const [selectedKey, setSelectedKey] = React.useState<string | undefined>(
    props.selectedKey ? getKey(props.selectedKey, props.selectedKeyKind) : undefined,
  );
  const [title, setTitle] = React.useState<React.ReactNode>(
    loaded ? placeholder : <LoadingInline />,
  );

  const autocompleteFilter = (text: string, item: React.ReactElement) =>
    fuzzy(text, item.props.name);

  const handleOnChange = React.useCallback(
    (key: string) => {
      if (_.find(actionItems, { actionKey: key })) {
        onChange(key);
        return;
      }

      const { name, kindLabel, resource } = items[key];
      setSelectedKey(key);
      setTitle(<ResourceName kind={kindLabel} name={name} />);
      onChange(name, kindLabel, resource);
    },
    [actionItems, items, onChange],
  );

  React.useEffect(() => {
    if (loadError) {
      setTitle(
        <div className="cos-error-title">{t('public~Error loading {{desc}}', { desc })}</div>,
      );
      return;
    }

    const unsortedList = {};
    _.each(resources, ({ data }, kindLabel) => {
      (data || []).forEach((resource) => {
        if (!dataFilter || dataFilter(resource)) {
          unsortedList[`${resource.metadata.name}-${kindLabel}`] = {
            kindLabel,
            name: resource.metadata.name,
            resource,
          };
        }
      });
    });

    const sortedList = Object.fromEntries(
      Object.keys(unsortedList)
        .sort()
        .map((key) => [key, unsortedList[key]]),
    );

    setItems(sortedList);

    // Only update selectedKey if props.selectedKey is defined
    const newSelectedKey =
      props.selectedKey !== undefined
        ? getKey(props.selectedKey, props.selectedKeyKind)
        : selectedKey;

    setSelectedKey(newSelectedKey);

    const selectedItem = sortedList[newSelectedKey];

    setTitle(
      selectedItem ? (
        <ResourceName kind={selectedItem.kindLabel} name={selectedItem.name} />
      ) : (
        placeholder
      ),
    );
  }, [
    loaded,
    loadError,
    resources,
    dataFilter,
    props.selectedKey,
    props.selectedKeyKind,
    placeholder,
    desc,
    t,
    selectedKey,
  ]);

  const renderedItems = React.useMemo(() => {
    const result = {};
    _.keys(items).forEach((key) => {
      const item = items[key];
      result[key] = <ResourceName kind={item.kindLabel} name={item.name} />;
    });
    return result;
  }, [items]);

  return (
    <div>
      {fixed ? (
        renderedItems[selectedKey]
      ) : (
        <ConsoleSelect
          actionItems={actionItems}
          autocompleteFilter={autocompleteFilter}
          autocompletePlaceholder={placeholder}
          items={renderedItems}
          selectedKey={selectedKey}
          title={loaded ? title : <LoadingInline />}
          onChange={handleOnChange}
          id={id}
          isFullWidth
          menuClassName="dropdown-menu--text-wrap"
          disabled={disabled}
          dataTest={dataTest}
        />
      )}
      {loaded && _.isEmpty(renderedItems) && (desc || props.selectedKeyKind) && (
        <Alert
          isInline
          className="co-alert pf-v6-c-alert--top-margin"
          variant="info"
          title={t('public~No {{selection}} found', {
            selection: desc || props.selectedKeyKind,
          })}
        />
      )}
    </div>
  );
};

export const ListDropdown: React.FCC<ListDropdownProps> = (props) => {
  const resources = _.map(props.resources, (resource) =>
    _.assign({ isList: true, prop: resource.kind }, resource),
  );
  return (
    <Firehose resources={resources}>
      <ListDropdown_ {...props} />
    </Firehose>
  );
};

export const useProjectOrNamespaceModel = (): [K8sModel, boolean] | [] => {
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
  const canCreateNs = useFlag(FLAGS.CAN_CREATE_NS);
  const canCreateProject = useFlag(FLAGS.CAN_CREATE_PROJECT);

  if (flagPending(openshiftFlag) || flagPending(canCreateNs) || flagPending(canCreateProject)) {
    return [];
  }

  // NamespaceModal is used when not on an openshift cluster
  const model = openshiftFlag ? ProjectModel : NamespaceModel;
  const canCreate = openshiftFlag ? canCreateProject : canCreateNs;
  return [model, canCreate];
};

export const NsDropdown: React.FCC<ListDropdownProps> = (props) => {
  const { t } = useTranslation();
  const createNamespaceModal = useCreateNamespaceModal();
  const createProjectModal = useCreateProjectModal();
  const [selectedKey, setSelectedKey] = React.useState(props.selectedKey);
  const [model, canCreate] = useProjectOrNamespaceModel();

  const actionItems =
    model && canCreate
      ? [
          {
            actionTitle: t('public~Create {{resourceKindLabel}}', {
              resourceKindLabel: model.labelKey ? t(model.labelKey) : model.label,
            }),
            actionKey: `Create_${model.label}`,
          },
        ]
      : [];

  const onChange: ListDropdownProps['onChange'] = (actionKey, kindLabel, resource) => {
    switch (actionKey) {
      case 'Create_Namespace':
        createNamespaceModal({
          onSubmit: (newNamespace) => {
            setSelectedKey(newNamespace.metadata.name);
            props.onChange(newNamespace.metadata.name, newNamespace.kind, newNamespace);
          },
        });
        break;
      case 'Create_Project':
        createProjectModal({
          onSubmit: (newProject) => {
            setSelectedKey(newProject.metadata.name);
            props.onChange(newProject.metadata.name, newProject.kind, newProject);
          },
        });
        break;
      default:
        setSelectedKey(actionKey);
        props.onChange(actionKey, kindLabel, resource);
        break;
    }
  };

  const getPlaceholder = (placeholderModel) => {
    if (!placeholderModel.kind) {
      return t('public~Select item');
    }

    return t('public~Select {{kindLabel}}', {
      kindLabel: placeholderModel.labelKey ? t(placeholderModel.labelKey) : placeholderModel.label,
    });
  };

  return model ? (
    <ListDropdown
      {...props}
      actionItems={actionItems}
      desc={model.plural}
      onChange={onChange}
      placeholder={props.placeholder || getPlaceholder(model)}
      resources={[{ kind: `${model.kind}` }]}
      selectedKeyKind={model.kind}
      selectedKey={selectedKey}
    />
  ) : null;
};
