import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Tooltip,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { useNavigate } from 'react-router-dom-v5-compat';
import { impersonateStateToProps, ImpersonateKind, Action } from '@console/dynamic-plugin-sdk';
import { checkAccess, useAccessReview } from './rbac';
import {
  AccessReviewResourceAttributes,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
} from '../../module/k8s';
import { connectToModel } from '../../kinds';
import { ContextSubMenuItem } from '@patternfly/react-topology';

export const kebabOptionsToMenu = (options: KebabOption[]): KebabMenuOption[] => {
  const subs: { [key: string]: KebabSubMenuOption } = {};
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
  autoFocus,
  isAllowed,
}) => {
  const { t } = useTranslation();
  const isDisabled = !isAllowed || option.isDisabled || (!option.href && !option.callback);
  return (
    <DropdownItem
      onClick={(e) => !isDisabled && onClick(e, option)}
      autoFocus={autoFocus}
      isDisabled={isDisabled}
      data-test-action={option.labelKey ? t(option.labelKey, option.labelKind) : option.label}
      icon={option.icon}
    >
      {option.labelKey ? t(option.labelKey, option.labelKind) : option.label}
    </DropdownItem>
  );
};
export const KebabItemAccessReview_ = (
  props: KebabItemProps & { impersonate: ImpersonateKind },
) => {
  const { option, impersonate } = props;
  const isAllowed = useAccessReview(option.accessReview, impersonate);
  return <KebabItem_ {...props} isAllowed={isAllowed} />;
};

const KebabItemAccessReview = connect(impersonateStateToProps)(KebabItemAccessReview_);

export const isKebabSubMenu = (option: KebabMenuOption): option is KebabSubMenuOption => {
  // only a sub menu has children
  return Array.isArray((option as KebabSubMenuOption).children);
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

export const KebabMenuItems: React.FC<KebabMenuItemsProps> = ({ options, onClick, focusItem }) => {
  const { t } = useTranslation();

  return (
    <DropdownList>
      {_.map(options, (o, index) =>
        isKebabSubMenu(o) ? (
          <ContextSubMenuItem
            data-test-action={o.labelKey || o.label}
            label={o.labelKey ? t(o.labelKey) : o.label}
          >
            <KebabMenuItems options={o.children} onClick={onClick} focusItem={o.children[0]} />
            <>{/* ContextSubMenuItem expects ReactNode[] only */}</>
          </ContextSubMenuItem>
        ) : (
          <KebabItem
            key={index}
            option={o}
            onClick={onClick}
            autoFocus={focusItem ? o === focusItem : undefined}
          />
        ),
      )}
    </DropdownList>
  );
};

export const KebabItems: React.FC<KebabItemsProps> = ({ options, ...props }) => {
  const menuOptions = kebabOptionsToMenu(options);
  return <KebabMenuItems {...props} options={menuOptions} />;
};

export const Kebab: KebabComponent = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { options, isDisabled, terminatingTooltip } = props;
  const [active, setActive] = React.useState(false);

  const hide = () => {
    setActive(false);
  };

  const toggle = () => {
    setActive((prev) => !prev);
  };

  const onClick = (event, option: KebabOption) => {
    event.preventDefault();
    if (option.callback) {
      option.callback();
    }
    hide();
    if (option.href) {
      navigate(option.href);
    }
  };

  const onHover = () => {
    // Check access when hovering over a kebab to minimize flicker when opened.
    // This depends on `checkAccess` being memoized.
    _.each(options, (option: KebabOption) => {
      if (option.accessReview) {
        checkAccess(option.accessReview).catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Error while check action menu access review', e);
        });
      }
    });
  };

  const menuOptions = kebabOptionsToMenu(options);

  return (
    <Tooltip
      content={terminatingTooltip}
      trigger={isDisabled && terminatingTooltip ? 'mouseenter' : 'manual'}
    >
      <Dropdown
        isOpen={active}
        onSelect={hide}
        onOpenChange={setActive}
        popperProps={{
          enableFlip: true,
          position: 'right',
        }}
        style={{ overflow: 'inherit' }} // allow ContextSubMenuItem to work
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            data-test-id="kebab-button"
            onClick={toggle}
            onFocus={onHover}
            onMouseEnter={onHover}
            isDisabled={isDisabled}
            aria-label={t('public~Actions')}
            variant="plain"
            icon={<EllipsisVIcon />}
          />
        )}
        shouldFocusToggleOnSelect
      >
        <KebabMenuItems options={menuOptions} onClick={onClick} focusItem={menuOptions[0]} />
      </Dropdown>
    </Tooltip>
  );
};

Kebab.columnClass = 'pf-v6-c-table__action';

export const ResourceKebab = connectToModel((props: ResourceKebabProps) => {
  const { t } = useTranslation();
  const { actions, kindObj, resource, isDisabled, customData, terminatingTooltip } = props;

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
      isDisabled={isDisabled ?? _.has(resource.metadata, 'deletionTimestamp')}
      terminatingTooltip={
        _.has(resource.metadata, 'deletionTimestamp')
          ? terminatingTooltip || t('Resource is being deleted.')
          : ''
      }
    />
  );
});

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
  actions: Action[] | KebabAction[];
  kind: K8sResourceKindReference;
  resource: K8sResourceKind;
  isDisabled?: boolean;
  customData?: { [key: string]: any };
  terminatingTooltip?: string;
};

type KebabSubMenuOption = {
  label?: string;
  labelKey?: string;
  children: KebabMenuOption[];
};

export type KebabMenuOption = KebabSubMenuOption | KebabOption;

type KebabProps = {
  options: KebabOption[];
  isDisabled?: boolean;
  terminatingTooltip?: string;
  active?: boolean;
  id?: string;
};

type KebabItemProps = {
  option: KebabOption;
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  autoFocus?: boolean;
};

export type KebabItemsProps = {
  options: KebabOption[];
  onClick: (event: React.MouseEvent<{}>, option: KebabOption) => void;
  focusItem?: KebabOption;
  className?: string;
};

export type KebabFactory = { [name: string]: KebabAction } & { common?: KebabAction[] };

type KebabStaticProperties = {
  columnClass: string;
  factory?: KebabFactory;
};

type KebabComponent = React.FC<KebabProps> & KebabStaticProperties;
KebabItems.displayName = 'KebabItems';
ResourceKebab.displayName = 'ResourceKebab';
