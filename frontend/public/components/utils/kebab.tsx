import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import * as FocusTrap from 'focus-trap-react';
import { connect } from 'react-redux';
import { KEY_CODES, Tooltip } from '@patternfly/react-core';
import { EllipsisVIcon, AngleRightIcon } from '@patternfly/react-icons';
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
  clonePVCModal,
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
import { VolumeSnapshotModel } from '../../models';

export const kebabOptionsToMenu = (options: KebabOption[]): KebabMenuOption[] => {
  const subs: { [key: string]: KebabSubMenu } = {};
  const menuOptions: KebabMenuOption[] = [];

  options.forEach((o) => {
    if (!o.hidden) {
      if (o.path) {
        const parts = o.path.split('/');
        parts.forEach((p, i) => {
          let subMenu = subs[p];
          if (!subs[p]) {
            subMenu = {
              label: p,
              children: [],
            };
            subs[p] = subMenu;
            if (i === 0) {
              menuOptions.push(subMenu);
            } else {
              subs[parts[i - 1]].children.push(subMenu);
            }
          }
        });
        subs[parts[parts.length - 1]].children.push(o);
      } else {
        menuOptions.push(o);
      }
    }
  });
  return menuOptions;
};

const KebabItem_: React.FC<KebabItemProps & { isAllowed: boolean }> = ({
  option,
  onClick,
  onEscape,
  autoFocus,
  isAllowed,
}) => {
  const handleEscape = (e) => {
    if (e.keyCode === KEY_CODES.ESCAPE_KEY) {
      onEscape();
    }
  };
  const disabled = !isAllowed || option.isDisabled;
  const classes = classNames('pf-c-dropdown__menu-item', { 'pf-m-disabled': disabled });
  return (
    <button
      className={classes}
      onClick={(e) => !disabled && onClick(e, option)}
      autoFocus={autoFocus}
      onKeyDown={onEscape && handleEscape}
      data-test-action={option.label}
    >
      {option.icon && <span className="oc-kebab__icon">{option.icon}</span>}
      {option.label}
    </button>
  );
};
const KebabItemAccessReview_ = (props: KebabItemProps & { impersonate: string }) => {
  const { option, impersonate } = props;
  const isAllowed = useAccessReview(option.accessReview, impersonate);
  return <KebabItem_ {...props} isAllowed={isAllowed} />;
};

const KebabItemAccessReview = connect(impersonateStateToProps)(KebabItemAccessReview_);

type KebabSubMenuProps = {
  option: KebabSubMenu;
  onClick: KebabItemProps['onClick'];
};

const KebabSubMenu: React.FC<KebabSubMenuProps> = ({ option, onClick }) => {
  const [open, setOpen] = React.useState(false);
  const nodeRef = React.useRef(null);
  const subMenuRef = React.useRef(null);
  const referenceCb = React.useCallback(() => nodeRef.current, []);
  // use a callback ref because FocusTrap is old and doesn't support non-function refs
  const subMenuCbRef = React.useCallback((node) => (subMenuRef.current = node), []);

  return (
    <>
      <button
        ref={nodeRef}
        className="oc-kebab__sub pf-c-dropdown__menu-item"
        data-test-action={option.label}
        // mouse enter will open the sub menu
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={(e) => {
          // if the mouse leaves this item, close the sub menu only if the mouse did not enter the sub menu itself
          if (!subMenuRef.current || !subMenuRef.current.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        onKeyDown={(e) => {
          // open the sub menu on enter or right arrow
          if (e.keyCode === 39 || e.keyCode === 13) {
            setOpen(true);
            e.stopPropagation();
          }
        }}
      >
        {option.label}
        <AngleRightIcon className="oc-kebab__arrow" />
      </button>
      <Popper
        open={open}
        placement="right-start"
        closeOnEsc
        closeOnOutsideClick
        onRequestClose={(e) => {
          // only close the sub menu if clicking anywhere outside the menu item that owns the sub menu
          if (!e || !nodeRef.current || !nodeRef.current.contains(e.target as Node)) {
            setOpen(false);
          }
        }}
        reference={referenceCb}
      >
        <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
          <div
            ref={subMenuCbRef}
            role="presentation"
            className="pf-c-dropdown pf-m-expanded"
            onMouseLeave={(e) => {
              // only close the sub menu if the mouse does not enter the item
              if (!nodeRef.current || !nodeRef.current.contains(e.relatedTarget as Node)) {
                setOpen(false);
              }
            }}
            onKeyDown={(e) => {
              // close the sub menu on left arrow
              if (e.keyCode === 37) {
                setOpen(false);
                e.stopPropagation();
              }
            }}
          >
            <KebabMenuItems
              options={option.children}
              onClick={onClick}
              className="oc-kebab__popper-items"
              focusItem={option.children[0]}
            />
          </div>
        </FocusTrap>
      </Popper>
    </>
  );
};

export const isKebabSubMenu = (option: KebabMenuOption): option is KebabSubMenu => {
  // only a sub menu has children
  return Array.isArray((option as KebabSubMenu).children);
};

export const KebabItem: React.FC<KebabItemProps> = (props) => {
  const { option } = props;
  let item;

  if (option.accessReview) {
    item = <KebabItemAccessReview {...props} />;
  } else {
    item = <KebabItem_ {...props} isAllowed />;
  }

  return option.tooltip ? (
    <Tooltip position="left" content={option.tooltip}>
      {item}
    </Tooltip>
  ) : (
    item
  );
};

type KebabMenuItemsProps = {
  options: KebabMenuOption[];
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  focusItem?: KebabOption;
  className?: string;
};

export const KebabMenuItems: React.FC<KebabMenuItemsProps> = ({
  className,
  options,
  onClick,
  focusItem,
}) => (
  <ul
    className={classNames('pf-c-dropdown__menu pf-m-align-right', className)}
    data-test-id="action-items"
  >
    {_.map(options, (o) => (
      <li key={o.label}>
        {isKebabSubMenu(o) ? (
          <KebabSubMenu option={o} onClick={onClick} />
        ) : (
          <KebabItem
            option={o}
            onClick={onClick}
            autoFocus={focusItem ? o === focusItem : undefined}
          />
        )}
      </li>
    ))}
  </ul>
);

export const KebabItems: React.FC<KebabItemsProps> = ({ options, ...props }) => {
  const menuOptions = kebabOptionsToMenu(options);
  return <KebabMenuItems {...props} options={menuOptions} />;
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
    label: 'Edit Pod Count',
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
  PVCSnapshot: (kind, obj) => ({
    label: 'Create Snapshot',
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/${
      VolumeSnapshotModel.plural
    }/~new/form`,
    accessReview: asAccessReview(kind, obj, 'create'),
  }),
  ClonePVC: (kind, obj) => ({
    label: 'Clone PVC',
    callback: () =>
      clonePVCModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'create'),
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
  const options = _.reject(
    actions.map((a) => a(kindObj, resource)),
    'hidden',
  );
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

  getPopperReference = () => this.dropdownElement.current;

  render() {
    const { options, isDisabled } = this.props;

    const menuOptions = kebabOptionsToMenu(options);

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
          reference={this.getPopperReference}
        >
          <FocusTrap
            focusTrapOptions={{ clickOutsideDeactivates: true, returnFocusOnDeactivate: false }}
          >
            <div className="pf-c-dropdown pf-m-expanded">
              <KebabMenuItems
                options={menuOptions}
                onClick={this.onClick}
                className="oc-kebab__popper-items"
                focusItem={menuOptions[0]}
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
  // a `/` separated string where each segment denotes a new sub menu entry
  // Eg. `Menu 1/Menu 2/Menu 3`
  path?: string;
  icon?: React.ReactNode;
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

type KebabSubMenu = {
  label: string;
  children: KebabMenuOption[];
};

export type KebabMenuOption = KebabSubMenu | KebabOption;

type KebabItemProps = {
  option: KebabOption;
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  autoFocus?: boolean;
  onEscape?: () => void;
};

export type KebabItemsProps = {
  options: KebabOption[];
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  focusItem?: KebabOption;
  className?: string;
};

export type KebabFactory = { [name: string]: KebabAction } & { common?: KebabAction[] };

KebabItems.displayName = 'KebabItems';
ResourceKebab.displayName = 'ResourceKebab';
