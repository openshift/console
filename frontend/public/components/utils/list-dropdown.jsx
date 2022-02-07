import * as _ from 'lodash-es';
import * as React from 'react';
import fuzzy from 'fuzzysearch';
import * as PropTypes from 'prop-types';
import { Alert } from '@patternfly/react-core';
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAGS } from '@console/shared/src/constants';
import { Dropdown } from './dropdown';
import { Firehose } from './firehose';
import { LoadingInline } from './status-box';
import { ResourceName } from './resource-icon';
import { flagPending } from '../../reducers/features';
import { useAccessReview } from '@console/internal/components/utils';
import { createNamespaceModal, createProjectModal } from '../modals';
import { NamespaceModel, ProjectModel } from '@console/internal/models';
import { useTranslation, withTranslation } from 'react-i18next';

const getKey = (key, keyKind) => {
  return keyKind ? `${key}-${keyKind}` : key;
};

class ListDropdownWithTranslation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: {},
    };

    if (props.selectedKey) {
      this.state.selectedKey = getKey(props.selectedKey, props.selectedKeyKind);
    }

    this.state.title = props.loaded ? props.placeholder : <LoadingInline />;

    this.autocompleteFilter = (text, item) => fuzzy(text, item.props.name);
    // Pass both the resource name and the resource kind to onChange()
    this.onChange = (key) => {
      if (_.find(this.props.actionItems, { actionKey: key })) {
        this.props.onChange(key);
      }
      const { name, kindLabel, resource } = _.get(this.state, ['items', key], {});
      this.setState({ selectedKey: key, title: <ResourceName kind={kindLabel} name={name} /> });
      this.props.onChange?.(name, kindLabel, resource);
    };
  }

  UNSAFE_componentWillMount() {
    // we need to trigger state changes to get past shouldComponentUpdate...
    //   but the entire working set of data can be loaded in memory at this point in time
    //   in which case componentWillReceiveProps would not be called for a while...
    this.UNSAFE_componentWillReceiveProps(this.props);
  }

  UNSAFE_componentWillReceiveProps({
    desc,
    placeholder,
    loaded,
    loadError,
    resources,
    dataFilter,
    ...nextProps
  }) {
    if (!loaded) {
      return;
    }

    this.setState((currentState) => {
      if (loadError) {
        return {
          title: (
            <div className="cos-error-title">
              {this.props.t('public~Error loading {{desc}}', desc)}
            </div>
          ),
        };
      }

      const unsortedList = {};
      _.each(resources, ({ data }, kindLabel) => {
        _.reduce(
          data,
          (acc, resource) => {
            if (!dataFilter || dataFilter(resource)) {
              acc[`${resource.metadata.name}-${kindLabel}`] = {
                kindLabel,
                name: resource.metadata.name,
                resource,
              };
            }
            return acc;
          },
          unsortedList,
        );
      });

      const sortedList = {};
      _.keys(unsortedList)
        .sort()
        .forEach((key) => {
          sortedList[key] = unsortedList[key];
        });

      const keyChanged = currentState.selectedKey !== nextProps.selectedKey;
      const keyKindChanged = currentState.selectedKeyKind !== nextProps.selectedKeyKind;
      const selectedKey =
        keyChanged || keyKindChanged
          ? getKey(nextProps.selectedKey, nextProps.selectedKeyKind)
          : currentState.selectedKey;

      const selectedItem = sortedList[selectedKey];
      return {
        selectedKey,
        items: sortedList,
        title: selectedItem ? (
          <ResourceName kind={selectedItem.kindLabel} name={selectedItem.name} />
        ) : (
          placeholder
        ),
      };
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(this.state, nextState);
  }

  render() {
    const { desc, fixed, placeholder, id, loaded, disabled, t } = this.props;
    const items = {};

    _.keys(this.state.items).forEach((key) => {
      const item = this.state.items[key];
      items[key] = <ResourceName kind={item.kindLabel} name={item.name} />;
    });

    const { selectedKey } = this.state;

    const Component = fixed ? (
      items[selectedKey]
    ) : (
      <Dropdown
        actionItems={this.props.actionItems}
        autocompleteFilter={this.autocompleteFilter}
        autocompletePlaceholder={placeholder}
        items={items}
        selectedKey={selectedKey}
        title={this.state.title}
        onChange={this.onChange}
        id={id}
        dropDownClassName="dropdown--full-width"
        menuClassName="dropdown-menu--text-wrap"
        disabled={disabled}
        dataTest={this.props.dataTest}
      />
    );

    return (
      <div>
        {Component}
        {loaded && _.isEmpty(items) && (desc || this.props.selectedKeyKind) && (
          <Alert
            isInline
            className="co-alert pf-c-alert--top-margin"
            variant="info"
            title={t('public~No {{selection}} found', {
              selection: desc || this.props.selectedKeyKind,
            })}
          />
        )}
      </div>
    );
  }
}

const ListDropdown_ = withTranslation()(ListDropdownWithTranslation);

export const ListDropdown = (props) => {
  const resources = _.map(props.resources, (resource) =>
    _.assign({ isList: true, prop: resource.kind }, resource),
  );
  return (
    <Firehose resources={resources}>
      <ListDropdown_ {...props} />
    </Firehose>
  );
};

ListDropdown.propTypes = {
  dataFilter: PropTypes.func,
  desc: PropTypes.string,
  // specify both key/kind
  selectedKey: PropTypes.string,
  selectedKeyKind: PropTypes.string,
  fixed: PropTypes.bool,
  resources: PropTypes.arrayOf(
    PropTypes.shape({
      kind: PropTypes.string.isRequired,
      namespace: PropTypes.string,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  id: PropTypes.string,
  disabled: PropTypes.bool,
};

export const useProjectOrNamespaceModel = () => {
  const canCreateNamespace = useAccessReview({
    group: NamespaceModel.apiGroup,
    resource: NamespaceModel.plural,
    verb: 'create',
  });

  const canCreateProject = useFlag(FLAGS.CAN_CREATE_PROJECT);
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);

  if (flagPending(openshiftFlag) || flagPending(canCreateProject)) {
    return [];
  }

  // NamespaceModal is used when not on an openshift cluster
  const model = openshiftFlag ? ProjectModel : NamespaceModel;
  const canCreate = openshiftFlag ? canCreateProject : canCreateNamespace;
  return [model, canCreate];
};

/** @type {React.FC<{dataFilter?: (ns: any) => boolean, desc?: string, selectedKey?: string, fixed?: boolean, placeholder?: string, onChange?: (selectedKey: string, selectedKeyKind: string,  selectedResource?: K8sResourceKind) => void, id?: string, dataTest?: string}}>} */
export const NsDropdown = (props) => {
  const { t } = useTranslation();
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

  const onChange = (actionKey, kindLabel, resource) => {
    switch (actionKey) {
      case 'Create_Namespace':
        createNamespaceModal({
          blocking: true,
          onSubmit: (newNamespace) => {
            setSelectedKey(newNamespace.metadata.name);
            props.onChange?.(newNamespace.metadata.name, newNamespace.kind, newNamespace);
          },
        });
        break;
      case 'Create_Project':
        createProjectModal({
          blocking: true,
          onSubmit: (newProject) => {
            setSelectedKey(newProject.metadata.name);
            props.onChange?.(newProject.metadata.name, newProject.kind, newProject);
          },
        });
        break;
      default:
        props.onChange?.(actionKey, kindLabel, resource);
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
      placeholder={getPlaceholder(model)}
      resources={[{ kind: `${model.kind}` }]}
      selectedKeyKind={model.kind}
      selectedKey={selectedKey}
    />
  ) : null;
};
