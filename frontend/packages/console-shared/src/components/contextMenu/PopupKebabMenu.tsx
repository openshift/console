import * as React from 'react';
import { DropdownMenu } from '@patternfly/react-core';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { history, KebabItem, KebabOption } from '@console/internal/components/utils';
import './PopupKebabMenu.scss';

export interface PopupKebabMenuProps {
  kebabOptions: KebabOption[];
  className?: string;
  onClose?(): void;
  eventX: number;
  eventY: number;
  container?: Element;
}
interface PopopKebabMenuState {
  menuTop: number;
  menuLeft: number;
}

const MENU_PADDING = 20;

export class PopupKebabMenu extends React.Component<PopupKebabMenuProps, PopopKebabMenuState> {
  state = {
    menuTop: 0,
    menuLeft: 0,
  };

  private menu: Element;

  componentDidMount() {
    document.addEventListener('focus', this.handleBlur, true);
    this.updateMenuPosition();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.eventX !== prevProps.eventX ||
      this.props.eventY !== prevProps.eventY ||
      !_.isEqual(this.props.kebabOptions, prevProps.kebabOptions)
    ) {
      this.updateMenuPosition();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('focus', this.handleBlur, true);
  }

  updateMenuPosition = () => {
    const { container, eventX, eventY } = this.props;
    let menuTop = eventY;
    let menuLeft = eventX;

    if (container) {
      const menu: Element = this.menu.firstElementChild;
      if (menu) {
        const elementRect = container.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();

        if (
          eventY + menuRect.height + menuRect.top >
          elementRect.top + elementRect.height - MENU_PADDING
        ) {
          menuTop = Math.max(
            elementRect.top + elementRect.height - menuRect.height - menuRect.top - MENU_PADDING,
            0,
          );
        }
        if (
          eventX + menuRect.width + menuRect.left >
          elementRect.left + elementRect.width - MENU_PADDING
        ) {
          menuLeft = Math.max(
            elementRect.left + elementRect.width - menuRect.width - menuRect.left - MENU_PADDING,
            0,
          );
        }
      }
    }

    if (menuTop !== this.state.menuTop || menuLeft !== this.state.menuLeft) {
      this.setState({ menuTop, menuLeft });
    }
  };

  handleClose = () => {
    const { onClose } = this.props;

    onClose && onClose();
  };

  handleMenuMouseDown = (e) => {
    e.stopPropagation();
  };

  handleBlur = (e) => {
    if (!this.menu.contains(e.target)) {
      let focusTarget;

      const menuItems = this.menu.querySelectorAll('button');
      if (_.first(menuItems) === e.relatedTarget) {
        focusTarget = _.last(menuItems);
      } else if (_.last(menuItems) === e.relatedTarget) {
        focusTarget = _.first(menuItems);
      } else {
        focusTarget = e.relatedTarget;
      }

      focusTarget.focus();
    }
  };

  onKebabOptionClick = (event, option: KebabOption) => {
    event.stopPropagation();

    if (option.callback) {
      option.callback();
    }

    if (option.href) {
      history.push(option.href);
    }

    this.handleClose();
  };

  setMenu = (ref) => {
    this.menu = ref;
  };

  render() {
    const { className, kebabOptions } = this.props;
    const { menuTop, menuLeft } = this.state;
    const visibleOptions = _.reject(kebabOptions, (o) => _.get(o, 'hidden', false));
    const classes = classNames('ocs-popup-kebab-menu', className);

    return (
      <div className="pf-c-page ocs-popup-kebab-menu__container">
        <input className="ocs-popup-kebab-menu__faux-input" />
        <div className={classes}>
          <div
            className="ocs-popup-kebab-menu__backdrop"
            role="presentation"
            onMouseDown={this.handleClose}
          >
            <div
              className="pf-c-dropdown pf-m-expanded"
              style={{ top: menuTop, left: menuLeft }}
              ref={this.setMenu}
              role="presentation"
              onMouseDown={this.handleMenuMouseDown}
            >
              <DropdownMenu className="pf-c-dropdown__menu">
                {_.map(visibleOptions, (o, i) => (
                  <li key={i}>
                    <KebabItem
                      option={o}
                      onClick={this.onKebabOptionClick}
                      autoFocus={i === 0}
                      onEscape={this.handleClose}
                    />
                  </li>
                ))}
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
