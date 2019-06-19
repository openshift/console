import * as React from 'react';
import SvgDropShadowFilter from './SvgDropShadowFilter';
import { createSvgIdUrl } from '../../utils/svg-utils';

export interface State {
  bb?: { width: number; height: number };
}

export interface SvgBoxedTextProps {
  children?: string;
  className?: string;
  paddingX?: number;
  paddingY?: number;
  x?: number;
  y?: number;
  cornerRadius?: number;
}

const FILTER_ID = 'SvgBoxedTextDropShadowFilterId';

/**
 * Renders a `<text>` component with a `<rect>` box behind.
 */
export default class SvgBoxedText extends React.PureComponent<SvgBoxedTextProps, State> {
  private readonly textRef = React.createRef<SVGTextElement>();

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.computeBoxSize();
  }

  componentDidUpdate({ className, children }: SvgBoxedTextProps) {
    if (this.props.children !== children || this.props.className !== className) {
      this.computeBoxSize();
    }
  }

  private computeBoxSize() {
    const { current } = this.textRef;
    if (current && current.getBBox) {
      this.setState({ bb: current.getBBox() });
    }
  }

  render() {
    const {
      children,
      className,
      paddingX = 0,
      paddingY = 0,
      cornerRadius = 4,
      x = 0,
      y = 0,
      ...other
    } = this.props;
    const { bb } = this.state;
    return (
      <g className={className}>
        <SvgDropShadowFilter id={FILTER_ID} />
        {bb && (
          <rect
            filter={createSvgIdUrl(FILTER_ID)}
            x={x - paddingX - bb.width / 2}
            width={bb.width + paddingX * 2}
            y={y - paddingY - bb.height / 2}
            height={bb.height + paddingY * 2}
            rx={cornerRadius}
            ry={cornerRadius}
          />
        )}
        <text {...other} ref={this.textRef} x={x} y={y} textAnchor="middle" dy="0.3em">
          {children}
        </text>
      </g>
    );
  }
}
