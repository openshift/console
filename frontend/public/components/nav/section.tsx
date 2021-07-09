import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { NavExpandable, NavGroup } from '@patternfly/react-core';

import { withExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { NavItem, isNavItem } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { withActivePerspective } from '@console/shared';
import { RootState } from '../../redux';
import { featureReducerName, flagPending, FeatureState } from '../../reducers/features';
import { stripBasePath } from '../utils';
import { stripNS, createLink } from './items';
import { sortExtensionItems } from './navSortUtils';

const navSectionStateToProps = (
  state: RootState,
  { required }: NavSectionProps,
): NavSectionStateProps => {
  const flags = state[featureReducerName];
  const canRender = required ? flags.get(required) : true;

  return {
    flags,
    canRender,
    activeNamespace: state.UI.get('activeNamespace'),
    location: state.UI.get('location'),
  };
};

const findChildIndex = (id: string, Children: React.ReactElement[]) =>
  Children.findIndex((c) => c.props.id === id);

const mergePluginChild = (
  Children: React.ReactElement[],
  pluginChild: React.ReactElement,
  insertBefore?: string | string[],
  insertAfter?: string | string[],
) => {
  let index = -1;
  const before = Array.isArray(insertBefore) ? insertBefore : [insertBefore];
  const after = Array.isArray(insertAfter) ? insertAfter : [insertAfter];
  let count = 0;
  while (count < before.length && index < 0) {
    index = findChildIndex(before[count++], Children);
  }
  count = 0;
  while (count < after.length && index < 0) {
    index = findChildIndex(after[count++], Children);
    if (index >= 0) {
      index += 1;
    }
  }

  if (index >= 0) {
    Children.splice(index, 0, pluginChild);
  } else {
    Children.push(pluginChild);
  }
};

export const NavSection = connect(navSectionStateToProps)(
  withExtensions<NavSectionExtensionProps>({
    navItemExtensions: isNavItem,
    perspectiveExtensions: isPerspective,
  })(
    withActivePerspective(
      class NavSection extends React.Component<Props, NavSectionState> {
        public state: NavSectionState;

        constructor(props) {
          super(props);
          this.state = { isOpen: false, activeChild: null };

          const activeChild = this.getActiveChild();
          if (activeChild) {
            this.state.activeChild = activeChild;
            this.state.isOpen = true;
          }
        }

        shouldComponentUpdate(nextProps, nextState) {
          const { isOpen } = this.state;

          if (isOpen !== nextProps.isOpen) {
            return true;
          }

          if (!isOpen && !nextState.isOpen) {
            return false;
          }

          return nextProps.location !== this.props.location || nextProps.flags !== this.props.flags;
        }

        getActiveChild() {
          const { activeNamespace, location } = this.props;
          const children = this.getChildren();

          if (!children) {
            return stripBasePath(location).startsWith(this.props.activePath);
          }

          const resourcePath = location ? stripNS(location) : '';

          //current bug? - we should be checking if children is a single item or .filter is undefined
          return (children as any[])
            .filter((c) => {
              if (!c) {
                return false;
              }
              if (c.props.startsWith) {
                const active = c.type.startsWith(resourcePath, c.props.startsWith);
                if (active || !c.props.activePath) {
                  return active;
                }
              }
              return c.type.isActive && c.type.isActive(c.props, resourcePath, activeNamespace);
            })
            .map((c) => `${c.props.id}-${c.props.name}`)[0];
        }

        componentDidUpdate(prevProps, prevState) {
          const activeChild = this.getActiveChild();

          if (prevState.activeChild !== activeChild) {
            const state: Partial<NavSectionState> = { activeChild };
            if (activeChild && !prevState.activeChild) {
              state.isOpen = true;
            }
            this.setState(state as NavSectionState);
          }
        }

        toggle = (e, expandState) => {
          this.setState({ isOpen: expandState });
        };

        getNavItemExtensions = (perspective: string, title: string, id: string) => {
          const { navItemExtensions, perspectiveExtensions } = this.props;

          const defaultPerspective = _.find(perspectiveExtensions, (p) => p.properties.default);
          const isDefaultPerspective =
            defaultPerspective && perspective === defaultPerspective.properties.id;

          return navItemExtensions.filter(
            (item) =>
              // check if the item is contributed to the current perspective,
              // or if no perspective specified, are we in the default perspective
              (item.properties.perspective === perspective ||
                (!item.properties.perspective && isDefaultPerspective)) &&
              item.properties.section === id,
          );
        };

        mapChild = (c: React.ReactElement) => {
          if (!c) {
            return null;
          }

          const { activeChild } = this.state;
          const { flags, activeNamespace } = this.props;
          const { name, required, disallowed, id } = c.props;

          const requiredArray = required ? _.castArray(required) : [];
          const requirementMissing = _.some(
            requiredArray,
            (flag) => flag && (flagPending(flags.get(flag)) || !flags.get(flag)),
          );
          if (requirementMissing) {
            return null;
          }
          if (disallowed && (flagPending(flags.get(disallowed)) || flags.get(disallowed))) {
            return null;
          }

          return React.cloneElement(c, {
            key: name,
            isActive: `${id}-${name}` === activeChild,
            activeNamespace,
            flags,
          });
        };

        getChildren() {
          const { id, title, children, activePerspective: perspective } = this.props;
          const Children = React.Children.map(children, this.mapChild) || [];
          const childItems = sortExtensionItems(this.getNavItemExtensions(perspective, title, id));

          childItems.forEach((item) => {
            const pluginChild = this.mapChild(createLink(item));
            if (pluginChild) {
              mergePluginChild(
                Children,
                pluginChild,
                item.properties.insertBefore,
                item.properties.insertAfter,
              );
            }
          });

          return Children;
        }

        render() {
          if (!this.props.canRender) {
            return null;
          }

          const { title, isGrouped, 'data-quickstart-id': dataQuickStartId } = this.props;
          const { isOpen, activeChild } = this.state;
          const isActive = !!activeChild;
          const children = this.getChildren();

          if (!children.length) {
            return null;
          }

          if (isGrouped) {
            return (
              <NavGroup title="" data-quickstart-id={dataQuickStartId}>
                {children}
              </NavGroup>
            );
          }

          return (
            <NavExpandable
              title={title}
              isActive={isActive}
              isExpanded={isOpen}
              onExpand={this.toggle}
              data-test="nav"
              buttonProps={{ 'data-quickstart-id': dataQuickStartId }}
            >
              {children}
            </NavExpandable>
          );
        }
      },
    ),
  ),
);

export type NavSectionTitle =
  | 'Administration'
  | 'Builds'
  | 'Compute'
  | 'Home'
  | 'Observe'
  | 'Networking'
  | 'Operators'
  | 'Service Catalog'
  | 'Storage'
  | 'Workloads';

type NavSectionStateProps = {
  flags?: FeatureState;
  canRender?: boolean;
  activeNamespace?: string;
  activePath?: string;
  location?: string;
};

type NavSectionExtensionProps = {
  navItemExtensions: LoadedExtension<NavItem>[];
  perspectiveExtensions: Perspective[];
};

type NavSectionProps = {
  id: string;
  title: NavSectionTitle | string;
  isGrouped?: boolean;
  required?: string;
  activePerspective?: string;
  'data-quickstart-id'?: string;
};

type Props = NavSectionProps & NavSectionStateProps & NavSectionExtensionProps;

type NavSectionState = {
  isOpen: boolean;
  activeChild: React.ReactNode;
};
