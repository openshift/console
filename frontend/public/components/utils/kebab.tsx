import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as FocusTrap from 'focus-trap-react';
import { connect } from 'react-redux';
import { KEY_CODES, Tooltip } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import Popper from '@console/shared/src/components/popper/Popper';
import {
  annotationsModal,
  configureReplicaCountModal,
  taintsModal,
  tolerationsModal,
  labelsModal,
  podSelectorModal,
  deleteModal,
  expandPVCModal,
} from '../modals';
import { asAccessReview, checkAccess, history, resourceObjPath, useAccessReview } from './index';
import {
  AccessReviewResourceAttributes,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
} from '../../module/k8s';
import { impersonateStateToProps } from '../../reducers/ui';
import { connectToModel } from '../../kinds';
import * as plugins from '../../plugins';

const KebabItemEnabled: React.FC<KebabItemProps> = ({ option, onClick, onEscape, autoFocus }) => {
  const handleEscape = (e) => {
    if (e.keyCode === KEY_CODES.ESCAPE_KEY) {
      onEscape();
    }
  };

  return (
    <button
      className="pf-c-dropdown__menu-item"
      onClick={(e) => onClick(e, option)}
      autoFocus={autoFocus}
      onKeyDown={onEscape && handleEscape}
      data-test-action={option.label}
    >
      {option.label}
    </button>
  );
};

const KebabItemDisabled: React.FC<KebabItemDisabledProps> = ({ option }) => {
  return <button className="pf-c-dropdown__menu-item pf-m-disabled">{option.label}</button>;
};

const KebabItemAccessReview_ = (props: KebabItemProps & { impersonate: string }) => {
  const { option, impersonate } = props;
  const isAllowed = useAccessReview(option.accessReview, impersonate);
  return isAllowed ? <KebabItemEnabled {...props} /> : <KebabItemDisabled option={option} />;
};
const KebabItemAccessReview = connect(impersonateStateToProps)(KebabItemAccessReview_);

export const KebabItem: React.FC<KebabItemProps> = (props) => {
  let item;

  if (props.option.accessReview) {
    item = <KebabItemAccessReview {...props} />;
  } else if (props.option.isDisabled) {
    item = <KebabItemDisabled option={props.option} />;
  } else {
    item = <KebabItemEnabled {...props} />;
  }

  return props.option.tooltip ? (
    <Tooltip position="left" content={props.option.tooltip}>
      {item}
    </Tooltip>
  ) : (
    item
  );
};

export const KebabItems: React.SFC<KebabItemsProps> = ({
  className,
  options,
  onClick,
  focusItem,
}) => {
  const visibleOptions = _.reject(options, (o) => _.get(o, 'hidden', false));
  return (
    <ul
      className={classNames('pf-c-dropdown__menu pf-m-align-right', className)}
      data-test-id="action-items"
    >
      {_.map(visibleOptions, (o, i) => (
        <li key={i}>
          <KebabItem
            option={o}
            onClick={onClick}
            autoFocus={focusItem ? o === focusItem : undefined}
          />
        </li>
      ))}
    </ul>
  );
};

const kebabFactory: KebabFactory = {
  Delete: (kind, obj) => ({
    label: `Delete ${kind.label}`,
    callback: () =>
      deleteModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'delete'),
  }),
  Edit: (kind, obj) => ({
    label: `Edit ${kind.label}`,
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/yaml`,
    // TODO: Fallback to "View YAML"? We might want a similar fallback for annotations, labels, etc.
    accessReview: asAccessReview(kind, obj, 'update'),
  }),
  ModifyLabels: (kind, obj) => ({
    label: 'Edit Labels',
    callback: () =>
      labelsModal({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyPodSelector: (kind, obj) => ({
    label: 'Edit Pod Selector',
    callback: () =>
      podSelectorModal({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyAnnotations: (kind, obj) => ({
    label: 'Edit Annotations',
    callback: () =>
      annotationsModal({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyCount: (kind, obj) => ({
    label: 'Edit Count',
    callback: () =>
      configureReplicaCountModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyTaints: (kind, obj) => ({
    label: 'Edit Taints',
    callback: () =>
      taintsModal({
        resourceKind: kind,
        resource: obj,
        modalClassName: 'modal-lg',
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyTolerations: (kind, obj) => ({
    label: 'Edit Tolerations',
    callback: () =>
      tolerationsModal({
        resourceKind: kind,
        resource: obj,
        modalClassName: 'modal-lg',
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  AddStorage: (kind, obj) => ({
    label: 'Add Storage',
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/attach-storage`,
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ExpandPVC: (kind, obj) => ({
    label: 'Expand PVC',
    callback: () =>
      expandPVCModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
};

// The common menu actions that most resource share
kebabFactory.common = [
  kebabFactory.ModifyLabels,
  kebabFactory.ModifyAnnotations,
  kebabFactory.Edit,
  kebabFactory.Delete,
];

export const getExtensionsKebabActionsForKind = (kind: K8sKind) => {
  const extensionActions = [];
  _.forEach(plugins.registry.getKebabActions(), (getActions: any) => {
    if (getActions) {
      _.forEach(getActions.properties.getKebabActionsForKind(kind), (kebabAction) => {
        extensionActions.push(kebabAction);
      });
    }
  });
  return extensionActions;
};

export const ResourceKebab = connectToModel((props: ResourceKebabProps) => {
  const { actions, kindObj, resource, isDisabled } = props;

  if (!kindObj) {
    return null;
  }
  const options = _.reject(actions.map((a) => a(kindObj, resource)), 'hidden');
  return (
    <Kebab
      options={options}
      key={resource.metadata.uid}
      isDisabled={
        isDisabled !== undefined ? isDisabled : _.get(resource.metadata, 'deletionTimestamp')
      }
    />
  );
});

export class Kebab extends React.Component<any, { active: boolean }> {
  static factory: KebabFactory = kebabFactory;
  static getExtensionsActionsForKind = getExtensionsKebabActionsForKind;

  // public static columnClass: string = 'pf-c-table__action';
  public static columnClass: string = 'dropdown-kebab-pf pf-c-table__action';

  private dropdownElement = React.createRef<HTMLButtonElement>();

  constructor(props) {
    super(props);
    this.state = {
      active: false,
    };
  }

  onClick = (event, option: KebabOption) => {
    event.preventDefault();

    if (option.callback) {
      option.callback();
    }

    this.hide();

    if (option.href) {
      history.push(option.href);
    }
  };

  hide = () => {
    this.dropdownElement.current && this.dropdownElement.current.focus();
    this.setState({ active: false });
  };

  toggle = () => {
    this.setState((state) => ({ active: !state.active }));
  };

  onHover = () => {
    // Check access when hovering over a kebab to minimize flicker when opened.
    // This depends on `checkAccess` being memoized.
    _.each(this.props.options, (option: KebabOption) => {
      if (option.accessReview) {
        checkAccess(option.accessReview);
      }
    });
  };

  handleRequestClose = (e?: MouseEvent) => {
    if (
      !e ||
      !this.dropdownElement.current ||
      !this.dropdownElement.current.contains(e.target as Node)
    ) {
      this.hide();
    }
  };

  render() {
    const { options, isDisabled } = this.props;

    return (
      <div
        className={classNames({
          'dropdown pf-c-dropdown': true,
          'pf-m-expanded': this.state.active,
        })}
      >
        <button
          ref={this.dropdownElement}
          type="button"
          aria-expanded={this.state.active}
          aria-haspopup="true"
          aria-label="Actions"
          className="pf-c-dropdown__toggle pf-m-plain"
          data-test-id="kebab-button"
          disabled={isDisabled}
          onClick={this.toggle}
          onFocus={this.onHover}
          onMouseEnter={this.onHover}
        >
          <EllipsisVIcon />
        </button>
        <Popper
          open={!isDisabled && this.state.active}
          placement="bottom-end"
          closeOnEsc
          closeOnOutsideClick
          onRequestClose={this.handleRequestClose}
          reference={() => this.dropdownElement.current}
          popperOptions={{
            modifiers: {
              preventOverflow: {
                boundariesElement: document.body,
              },
            },
          }}
        >
          <FocusTrap
            focusTrapOptions={{ clickOutsideDeactivates: true, returnFocusOnDeactivate: false }}
          >
            <div className="pf-c-dropdown pf-m-expanded">
              <KebabItems
                options={options}
                onClick={this.onClick}
                className="oc-kebab__popper-items"
                focusItem={options[0]}
              />
            </div>
          </FocusTrap>
        </Popper>
      </div>
    );
  }
}

export type KebabOption = {
  hidden?: boolean;
  label: string;
  href?: string;
  callback?: () => any;
  accessReview?: AccessReviewResourceAttributes;
  isDisabled?: boolean;
  tooltip?: string;
};
export type KebabAction = (
  kind: K8sKind,
  obj: K8sResourceKind,
  resources?: any,
  customData?: any,
) => KebabOption;

export type ResourceKebabProps = {
  kindObj: K8sKind;
  actions: KebabAction[];
  kind: K8sResourceKindReference;
  resource: K8sResourceKind;
  isDisabled?: boolean;
};

type KebabItemProps = {
  option: KebabOption;
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  isActionDropdown?: boolean;
  autoFocus?: boolean;
  onEscape?: () => void;
};

type KebabItemDisabledProps = React.HTMLProps<HTMLButtonElement> & {
  option: KebabOption;
  isActionDropdown?: boolean;
};

export type KebabItemsProps = {
  options: KebabOption[];
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  isActionDropdown?: boolean;
  focusItem?: KebabOption;
  className?: string;
};

export type KebabFactory = { [name: string]: KebabAction } & { common?: KebabAction[] };

KebabItems.displayName = 'KebabItems';
ResourceKebab.displayName = 'ResourceKebab';
