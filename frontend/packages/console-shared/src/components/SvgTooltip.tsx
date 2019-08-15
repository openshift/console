import * as React from 'react';
import { TooltipPosition } from '@patternfly/react-core';
import './SvgTooltip.scss';

type TooltipProps = {
  active?: boolean;
  parentBox: { x: number; y: number; width: number; height: number };
  arrowPosition?: TooltipPosition;
  getContent: (boxX: number, boxY: number) => React.ReactNode;
};

type State = {
  bb?: SVGRect;
  isActive: boolean;
};

const PADDING_X = 10;
const PADDING_Y = 5;
const OFFSET_X = 3;
const OFFSET_Y = 3;

const ARROW_HEIGHT = 18;
const ARROW_WIDTH = 10;

export default class SvgTooltip extends React.Component<TooltipProps> {
  state: State = {
    bb: null,
    isActive: false,
  };

  groupRef = React.createRef<SVGGElement>();

  unmounted: boolean = false;

  activeTimeout = null;

  componentDidMount() {
    this.computeBoxSize();
  }

  componentDidUpdate({ active }: TooltipProps, { isActive }: State) {
    if (isActive !== this.state.isActive) {
      this.computeBoxSize();
    }

    if (this.props.active !== active) {
      if (this.state.isActive === this.props.active) {
        if (this.activeTimeout) {
          clearTimeout(this.activeTimeout);
          this.activeTimeout = null;
        }
      } else if (this.props.active) {
        this.activeTimeout = setTimeout(() => this.setActive(true), 200);
      } else {
        this.setActive(false);
      }
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  private setActive(isActive: boolean): void {
    if (!this.unmounted) {
      this.setState({ isActive });
    }
  }

  private computeBoxSize() {
    if (this.state.isActive) {
      this.setState({ bb: this.groupRef.current.getBBox() });
    }
  }

  render() {
    const { isActive, bb } = this.state;
    const { parentBox, getContent, arrowPosition = 'top' } = this.props;
    const bbWidth = bb ? bb.width : 0;
    const bbHeight = bb ? bb.height : 0;
    let boxX;
    let boxY;
    let arrowPoints = ['', '', ''];

    if (!isActive) {
      return null;
    }

    const left = parentBox.x;
    const right = parentBox.x + parentBox.width;
    const top = parentBox.y;
    const bottom = parentBox.y + parentBox.height;
    const centerX = parentBox.x + parentBox.width / 2;
    const centerY = parentBox.y + parentBox.height / 2;

    switch (arrowPosition) {
      case TooltipPosition.top:
        boxX = left + (parentBox.width - bbWidth) / 2 - PADDING_X;
        boxY = top - OFFSET_Y - ARROW_WIDTH - bbHeight - PADDING_Y * 2;
        arrowPoints = [
          `${centerX},${top - OFFSET_Y}`,
          `${centerX - ARROW_HEIGHT / 2},${top - OFFSET_Y - ARROW_WIDTH - 2}`,
          `${centerX + ARROW_HEIGHT / 2},${top - OFFSET_Y - ARROW_WIDTH - 2}`,
        ];
        break;
      case TooltipPosition.bottom:
        boxX = left + (parentBox.width - bbWidth) / 2 - PADDING_X;
        boxY = bottom + OFFSET_Y + ARROW_WIDTH;
        arrowPoints = [
          `${centerX},${bottom + OFFSET_Y}`,
          `${centerX / 2 - ARROW_HEIGHT / 2},${boxY + 2}`,
          `${centerX + ARROW_HEIGHT / 2},${boxY + 2}`,
        ];
        break;
      case TooltipPosition.right:
        boxX = right + OFFSET_X + ARROW_WIDTH;
        boxY = top + (parentBox.height - bbHeight) / 2 - PADDING_Y;
        arrowPoints = [
          `${right + OFFSET_X},${centerY}`,
          `${boxX + 2},${centerY - ARROW_HEIGHT / 2}`,
          `${boxX + 2},${centerY + ARROW_HEIGHT / 2}`,
        ];
        break;
      default:
        // TooltipPosition.left
        boxX = left - OFFSET_X - ARROW_WIDTH - bbWidth - PADDING_X * 2;
        boxY = top + (parentBox.height - bbHeight) / 2 - PADDING_Y;
        arrowPoints = [
          `${left - OFFSET_X},${centerY}`,
          `${left - OFFSET_X - ARROW_WIDTH - 2},${centerY - ARROW_HEIGHT / 2}`,
          `${left - OFFSET_X - ARROW_WIDTH - 2},${centerY + ARROW_HEIGHT / 2}`,
        ];
        break;
    }

    return (
      <g className="odc-svg-tooltip">
        <rect x={boxX} y={boxY} width={bbWidth + PADDING_X * 2} height={bbHeight + PADDING_Y * 2} />
        <polygon points={`${arrowPoints[0]} ${arrowPoints[1]} ${arrowPoints[2]}`} />
        <g ref={this.groupRef}>{getContent(boxX + PADDING_X, boxY + PADDING_Y)}</g>
      </g>
    );
  }
}
