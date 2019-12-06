import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PopupKebabMenu } from '@console/shared/src';
import { KebabOption } from '@console/internal/components/utils';
import { ActionProvider, ContextMenuProvider, GraphElementType } from '../topology2/topology-types';

export interface GraphContextMenuProps {
  actionProvider: ActionProvider;
}

interface MenuState {
  isOpen: boolean;
  kebabOptions: KebabOption[];
  eventX: number;
  eventY: number;
}

export class GraphContextMenu extends React.Component<GraphContextMenuProps, MenuState>
  implements ContextMenuProvider {
  private menuContainer: HTMLElement;

  private modalContainer: HTMLElement;

  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      kebabOptions: null,
      eventX: 0,
      eventY: 0,
    };
  }

  componentDidMount() {
    this.modalContainer = document.getElementById('modal-container');
  }

  public open = (type: GraphElementType, id: string, eventX: number, eventY: number) => {
    const { actionProvider } = this.props;

    const kebabOptions = actionProvider(type, id);
    const isOpen = kebabOptions && kebabOptions.length > 0;

    this.setState({ isOpen, kebabOptions, eventX, eventY });

    return isOpen;
  };

  public onClose = () => {
    this.setState({ isOpen: false });
  };

  setMenuContainer = (ref: HTMLElement) => {
    this.menuContainer = ref;
  };

  renderContextMenu() {
    const { kebabOptions, eventX, eventY } = this.state;

    return (
      <PopupKebabMenu
        onClose={this.onClose}
        container={this.menuContainer}
        kebabOptions={kebabOptions}
        eventX={eventX}
        eventY={eventY}
      />
    );
  }

  render() {
    const { isOpen } = this.state;

    return (
      <div className="odc-graph-context-menu" ref={this.setMenuContainer}>
        {isOpen && ReactDOM.createPortal(this.renderContextMenu(), this.modalContainer)}
      </div>
    );
  }
}
