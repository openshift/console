import * as React from 'react';
import * as classNames from 'classnames';
import SvgDropShadowFilter from '../../svg/SvgDropShadowFilter';
import { createSvgIdUrl } from '../../../utils/svg-utils';
import SvgBoxedText from '../../svg/SvgBoxedText';

import './BaseNode.scss';

export interface State {
  hover?: boolean;
  labelHover?: boolean;
}

export interface BaseNodeProps {
  x?: number;
  y?: number;
  outerRadius: number;
  innerRadius?: number;
  selected?: boolean;
  onSelect?: Function;
  icon?: string;
  label?: string;
  kind?: string;
  children?: React.ReactNode;
  attachments?: React.ReactNode;
  isDragging?: boolean;
}

const FILTER_ID = 'BaseNodeDropShadowFilterId';
const FILTER_ID_HOVER = 'BaseNodeDropShadowFilterId--hover';

const MAX_LABEL_LENGTH = 16;

const truncateEnd = (text: string = ''): string => {
  if (text.length <= MAX_LABEL_LENGTH) {
    return text;
  }
  return `${text.substr(0, MAX_LABEL_LENGTH - 1)}…`;
};

export default class BaseNode extends React.Component<BaseNodeProps, State> {
  hoverTimer = null;

  unmounted: boolean = false;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  onLabelEnter = () => {
    if (!this.hoverTimer) {
      this.hoverTimer = setTimeout(() => {
        if (!this.unmounted) {
          this.setState({ labelHover: true });
        }
      }, 200);
    }
  };

  onLabelLeave = () => {
    this.setState({ labelHover: false });

    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  };

  render() {
    const {
      x = 0,
      y = 0,
      outerRadius,
      innerRadius = outerRadius / 1.4,
      selected,
      icon,
      label,
      kind,
      onSelect,
      children,
      attachments,
      isDragging,
    } = this.props;
    const { hover, labelHover } = this.state;

    const contentsClasses = classNames('odc-base-node__contents', {
      'odc-m-is-highlight': isDragging,
    });

    return (
      <g transform={`translate(${x}, ${y})`} className="odc-base-node">
        <g
          onClick={
            onSelect
              ? (e) => {
                  e.stopPropagation();
                  onSelect();
                }
              : null
          }
          onMouseEnter={() => this.setState({ hover: true })}
          onMouseLeave={() => this.setState({ hover: false })}
        >
          <SvgDropShadowFilter id={FILTER_ID} />
          <SvgDropShadowFilter id={FILTER_ID_HOVER} dy={3} stdDeviation={7} floodOpacity={0.24} />
          <circle
            className="odc-base-node__bg"
            cx={0}
            cy={0}
            r={outerRadius}
            filter={hover ? createSvgIdUrl(FILTER_ID_HOVER) : createSvgIdUrl(FILTER_ID)}
          />
          <g className={contentsClasses}>
            <image
              x={-innerRadius}
              y={-innerRadius}
              width={innerRadius * 2}
              height={innerRadius * 2}
              xlinkHref={icon}
            />
            {label != null && (
              <SvgBoxedText
                className="odc-base-node__label"
                y={outerRadius + 20}
                x={0}
                paddingX={8}
                paddingY={4}
                kind={kind}
                onMouseEnter={this.onLabelEnter}
                onMouseLeave={this.onLabelLeave}
              >
                {labelHover ? label : truncateEnd(label)}
              </SvgBoxedText>
            )}
            {selected && (
              <circle
                className="odc-base-node__selection"
                cx={0}
                cy={0}
                r={outerRadius + 1}
                strokeWidth={2}
              />
            )}
            {children}
          </g>
        </g>
        <g className={contentsClasses}>{attachments}</g>
      </g>
    );
  }
}
