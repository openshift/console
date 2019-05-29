import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import memoize from 'memoize-one';
import { NavExpandable } from '@patternfly/react-core';

import { RootState } from '../../redux';
import { featureReducerName, flagPending, FeatureState } from '../../reducers/features';
import { stripBasePath } from '../utils';
import * as plugins from '../../plugins';
import { HrefLink, ResourceNSLink, ResourceClusterLink, stripNS } from './items';

const navSectionStateToProps = (state: RootState, {required}) => {
  const flags = state[featureReducerName];
  const canRender = required ? flags.get(required) : true;

  return {
    flags, canRender,
    activeNamespace: state.UI.get('activeNamespace'),
    location: state.UI.get('location'),
  };
};

const mergePluginChild = (Children: React.ReactElement[], pluginChild: React.ReactElement, mergeAfter?: string) => {
  const index = mergeAfter ? Children.findIndex(c => c.props.name === mergeAfter) : -1;
  if (index >= 0) {
    Children.splice(index + 1, 0, pluginChild);
  } else {
    Children.push(pluginChild);
  }
};

const getNavLinkFromItem = (item: plugins.NavItem, key: number): React.ReactElement | null => {
  if (plugins.isHrefNavItem(item)) {
    return <HrefLink key={key} {...item.properties.componentProps} />;
  }
  if (plugins.isResourceNSNavItem(item)) {
    return <ResourceNSLink key={key} {...item.properties.componentProps} />;
  }
  if (plugins.isResourceClusterNavItem(item)) {
    return <ResourceClusterLink key={key} {...item.properties.componentProps} />;
  }
  return null;
};

export const NavSection = connect(navSectionStateToProps)(
  class NavSection extends React.Component<NavSectionProps, NavSectionState> {
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
      const { activeNamespace, location, children } = this.props;

      if (!children) {
        return stripBasePath(location).startsWith(this.props.activePath);
      }

      const resourcePath = location ? stripNS(location) : '';

      //current bug? - we should be checking if children is a single item or .filter is undefined
      return (children as any[]).filter(c => {
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
      }).map(c => c.props.name)[0];
    }

    componentDidUpdate(prevProps, prevState) {
      if (prevProps.location === this.props.location) {
        return;
      }

      const activeChild = this.getActiveChild();
      const state: Partial<NavSectionState> = {activeChild};
      if (activeChild && !prevState.activeChild) {
        state.isOpen = true;
      }
      this.setState(state as NavSectionState);
    }

    toggle = (e, expandState) => {
      this.setState({isOpen: expandState});
    }

    getPluginNavItems = memoize(
      (section) => plugins.registry.getNavItems(section)
    );

    mapChild = (c: React.ReactElement): React.ReactElement | null => {
      if (!c) {
        return null;
      }

      const { activeChild } = this.state;
      const { flags, activeNamespace } = this.props;
      const { name, required, disallowed } = c.props;

      const requiredArray = required ? _.castArray(required) : [];
      const requirementMissing = _.some(requiredArray, flag => (
        flag && (flagPending(flags.get(flag)) || !flags.get(flag))
      ));
      if (requirementMissing) {
        return null;
      }
      if (disallowed && (flagPending(flags.get(disallowed)) || flags.get(disallowed))) {
        return null;
      }

      return React.cloneElement(c, {
        key: name,
        isActive: name === activeChild,
        activeNamespace,
        flags,
      });
    }

    render() {
      if (!this.props.canRender) {
        return null;
      }

      const { title, children } = this.props;
      const { isOpen, activeChild } = this.state;
      const isActive = !!activeChild;

      const Children: React.ReactElement[] | null = React.Children.map(children, this.mapChild) || [];

      this.getPluginNavItems(title).forEach((item, index) => {
        const pluginChild = this.mapChild(getNavLinkFromItem(item, index));
        if (pluginChild) {
          mergePluginChild(Children, pluginChild, item.properties.mergeAfter);
        }
      });

      return Children.length > 0 ? (
        <NavExpandable title={title} isActive={isActive} isExpanded={isOpen} onExpand={this.toggle}>
          {Children}
        </NavExpandable>
      ) : null;
    }
  }
);

export type NavSectionTitle =
  | 'Administration'
  | 'Builds'
  | 'Catalog'
  | 'Compute'
  | 'Home'
  | 'Monitoring'
  | 'Networking'
  | 'Storage'
  | 'Workloads';

type NavSectionProps = {
  flags?: FeatureState;
  title: NavSectionTitle;
  canRender?: boolean;
  activeNamespace?: string;
  activePath?: string;
  location?: string;
};

type NavSectionState = {
  isOpen: boolean;
  activeChild: React.ReactNode;
};
