import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { KEY_CODES, Tooltip, FocusTrap } from '@patternfly/react-core';
import { AngleRightIcon, EllipsisVIcon } from '@patternfly/react-icons';
import { subscribeToExtensions } from '@console/plugin-sdk/src/api/subscribeToExtensions';
import { KebabActions, isKebabActions } from '@console/plugin-sdk/src/typings/kebab-actions';
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
  restorePVCModal,
} from '../modals';
import { asAccessReview, checkAccess, history, resourceObjPath, useAccessReview } from './index';
import {
  AccessReviewResourceAttributes,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
  VolumeSnapshotKind,
} from '../../module/k8s';
import { impersonateStateToProps } from '../../reducers/ui';
import { connectToModel } from '../../kinds';
import { DeploymentConfigModel, DeploymentModel, VolumeSnapshotModel } from '../../models';

export const kebabOptionsToMenu = (options: KebabOption[]): KebabMenuOption[] => {
  const subs: { [key: string]: KebabSubMenu } = {};
  const menuOptions: KebabMenuOption[] = [];

  options.forEach((o) => {
    if (!o.hidden) {
      if (o.pathKey || o.path) {
        const parts = o.pathKey ? o.pathKey.split('/') : o.path.split('/');
        parts.forEach((p, i) => {
          let subMenu = subs[p];
          if (!subs[p]) {
            subMenu = o.pathKey
              ? {
                  labelKey: p,
                  children: [],
                }
              : {
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
  const { t } = useTranslation();
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
      disabled={disabled}
      data-test-action={option.labelKey ? t(option.labelKey, option.labelKind) : option.label}
    >
      {option.icon && <span className="oc-kebab__icon">{option.icon}</span>}
      {option.labelKey ? t(option.labelKey, option.labelKind) : option.label}
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
  const { t } = useTranslation();
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
        data-test-action={option.labelKey || option.label}
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
        {option.labelKey ? t(option.labelKey) : option.label}
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
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
            fallbackFocus: () => subMenuRef.current, // fallback to popover content wrapper div if there are no tabbable elements
          }}
        >
          <div
            ref={subMenuCbRef}
            role="presentation"
            className="pf-c-dropdown pf-m-expanded"
            tabIndex={-1}
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
  const tooltip = option.tooltipKey ? i18next.t(option.tooltipKey) : option.tooltip;

  return tooltip ? (
    <Tooltip position="left" content={tooltip}>
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
    {_.map(options, (o, index) => (
      <li key={index}>
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
    // t('public~Delete {{kind}}', {kind: kind.label})
    labelKey: 'public~Delete {{kind}}',
    labelKind: { kind: kind.labelKey ? i18next.t(kind.labelKey) : kind.label },
    callback: () =>
      deleteModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'delete'),
  }),
  Edit: (kind, obj) => ({
    // t('public~Edit {{kind}}', {kind: kind.label})
    labelKey: 'public~Edit {{kind}}',
    labelKind: { kind: kind.labelKey ? i18next.t(kind.labelKey) : kind.label },
    dataTest: `Edit ${kind.label}`,
    href: [DeploymentModel.kind, DeploymentConfigModel.kind].includes(kind.kind)
      ? `/edit-deployment/ns/${obj.metadata.namespace}?name=${obj.metadata.name}&kind=${kind.kind}`
      : `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/yaml`,
    // TODO: Fallback to "View YAML"? We might want a similar fallback for annotations, labels, etc.
    accessReview: asAccessReview(kind, obj, 'update'),
  }),
  ModifyLabels: (kind, obj) => ({
    // t('public~Edit labels')
    labelKey: 'public~Edit labels',
    callback: () =>
      labelsModal({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyPodSelector: (kind, obj) => ({
    // t('public~Edit Pod selector')
    labelKey: 'public~Edit Pod selector',
    callback: () =>
      podSelectorModal({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyAnnotations: (kind, obj) => ({
    // t('public~Edit annotations')
    labelKey: 'public~Edit annotations',
    callback: () =>
      annotationsModal({
        kind,
        resource: obj,
        blocking: true,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyCount: (kind, obj) => ({
    // t('public~Edit Pod count')
    labelKey: 'public~Edit Pod count',
    callback: () =>
      configureReplicaCountModal({
        resourceKind: kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'patch', 'scale'),
  }),
  ModifyTaints: (kind, obj) => ({
    // t('public~Edit taints')
    labelKey: 'public~Edit taints',
    callback: () =>
      taintsModal({
        resourceKind: kind,
        resource: obj,
        modalClassName: 'modal-lg',
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ModifyTolerations: (kind, obj) => ({
    // t('public~Edit tolerations')
    labelKey: 'public~Edit tolerations',
    callback: () =>
      tolerationsModal({
        resourceKind: kind,
        resource: obj,
        modalClassName: 'modal-lg',
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  AddStorage: (kind, obj) => ({
    // t('public~Add storage')
    labelKey: 'public~Add storage',
    href: `${resourceObjPath(obj, kind.crd ? referenceForModel(kind) : kind.kind)}/attach-storage`,
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  ExpandPVC: (kind, obj) => ({
    // t('public~Expand PVC')
    labelKey: 'public~Expand PVC',
    callback: () =>
      expandPVCModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'patch'),
  }),
  PVCSnapshot: (kind, obj) => ({
    // t('public~Create snapshot')
    labelKey: 'public~Create snapshot',
    isDisabled: obj?.status?.phase !== 'Bound',
    tooltip: obj?.status?.phase !== 'Bound' ? 'PVC is not Bound' : '',
    href: `/k8s/ns/${obj.metadata.namespace}/${VolumeSnapshotModel.plural}/~new/form?pvc=${obj.metadata.name}`,
    accessReview: asAccessReview(kind, obj, 'create'),
  }),
  ClonePVC: (kind, obj) => ({
    // t('public~Clone PVC')
    labelKey: 'public~Clone PVC',
    isDisabled: obj?.status?.phase !== 'Bound',
    tooltip: obj?.status?.phase !== 'Bound' ? 'PVC is not Bound' : '',
    callback: () =>
      clonePVCModal({
        kind,
        resource: obj,
      }),
    accessReview: asAccessReview(kind, obj, 'create'),
  }),
  RestorePVC: (kind, obj: VolumeSnapshotKind) => ({
    // t('public~Restore as new PVC')
    labelKey: 'public~Restore as new PVC',
    isDisabled: !obj?.status?.readyToUse,
    tooltip: !obj?.status?.readyToUse ? 'Volume Snapshot is not Ready' : '',
    callback: () =>
      restorePVCModal({
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

let kebabActionExtensions: KebabActions[] = [];

subscribeToExtensions<KebabActions>((extensions) => {
  kebabActionExtensions = extensions;
}, isKebabActions);

export const getExtensionsKebabActionsForKind = (kind: K8sKind) => {
  const actionsForKind: KebabAction[] = [];
  kebabActionExtensions.forEach((e) => {
    e.properties.getKebabActionsForKind(kind).forEach((kebabAction) => {
      actionsForKind.push(kebabAction);
    });
  });
  return actionsForKind;
};

export const ResourceKebab = connectToModel((props: ResourceKebabProps) => {
  const { actions, kindObj, resource, isDisabled, customData } = props;

  if (!kindObj) {
    return null;
  }
  const options = _.reject(
    actions.map((a) => a(kindObj, resource, null, customData)),
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

  private divElement = React.createRef<HTMLDivElement>();

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

  getDivReference = () => this.divElement.current;

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
            focusTrapOptions={{
              clickOutsideDeactivates: true,
              returnFocusOnDeactivate: false,
              fallbackFocus: this.getDivReference, // fallback to popover content wrapper div if there are no tabbable elements
            }}
          >
            <div ref={this.divElement} className="pf-c-dropdown pf-m-expanded" tabIndex={-1}>
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
  label?: React.ReactNode;
  labelKey?: string;
  labelKind?: { [key: string]: string | string[] };
  href?: string;
  callback?: () => any;
  accessReview?: AccessReviewResourceAttributes;
  isDisabled?: boolean;
  tooltip?: string;
  tooltipKey?: string;
  // a `/` separated string where each segment denotes a new sub menu entry
  // Eg. `Menu 1/Menu 2/Menu 3`
  path?: string;
  pathKey?: string;
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
  customData?: { [key: string]: any };
};

type KebabSubMenu = {
  label?: string;
  labelKey?: string;
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
