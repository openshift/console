import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Link, LinkProps } from 'react-router-dom';
import { NavItem } from '@patternfly/react-core';

// TODO [tech debt] Refactor to get rid of inheritance and implement as function component.
export class NavLink<P extends NavLinkProps> extends React.PureComponent<P> {
  static defaultProps = {
    required: [],
    disallowed: [],
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  static isActive(...args): boolean {
    throw new Error('not implemented');
  }

  get to(): string {
    throw new Error('not implemented');
  }

  static startsWith(resourcePath: string, someStrings: string[]) {
    return _.some(someStrings, (s) => resourcePath.startsWith(s));
  }

  render() {
    const {
      isActive,
      name,
      tipText,
      onClick,
      testID,
      children,
      className,
      dataAttributes,
      'data-tour-id': dataTourId,
      'data-quickstart-id': dataQuickStartId,
      insertBeforeName,
      dragRef,
    } = this.props;

    // onClick is now handled globally by the Nav's onSelect,
    // however onClick can still be passed if desired in certain cases

    const itemClasses = classNames(className, { 'pf-m-current': isActive });
    const linkClasses = classNames('pf-c-nav__link', { 'pf-m-current': isActive });
    const link = (
      <Link
        className={linkClasses}
        data-test-id={testID}
        to={this.to}
        onClick={onClick}
        title={tipText}
        data-tour-id={dataTourId}
        data-quickstart-id={dataQuickStartId}
        data-test="nav"
        {...dataAttributes}
      >
        {insertBeforeName}
        {name}
        {children}
      </Link>
    );
    return (
      <NavItem className={itemClasses} isActive={isActive}>
        {dragRef ? (
          <div ref={dragRef} style={{ padding: 0 }}>
            {link}
          </div>
        ) : (
          link
        )}
      </NavItem>
    );
  }
}

export type NavLinkProps = {
  name?: string;
  id?: LinkProps['id'];
  className?: string;
  onClick?: LinkProps['onClick'];
  isActive?: boolean;
  required?: string[];
  disallowed?: string[];
  startsWith?: string[];
  activePath?: string;
  tipText?: string;
  testID?: string;
  dataAttributes?: { [key: string]: string };
  'data-tour-id'?: string;
  'data-quickstart-id'?: string;
  insertBeforeName?: React.ReactNode;
  dragRef?: React.Ref<any>;
};

export type NavLinkComponent<T extends NavLinkProps = NavLinkProps> = React.ComponentType<T> & {
  isActive: (props: T, resourcePath: string, activeNamespace: string) => boolean;
};
