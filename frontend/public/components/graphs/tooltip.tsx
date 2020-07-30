// Mostly just a copy-paste from patternfly.
import * as React from 'react';
import { defaults } from 'lodash';
//@ts-ignore
import { Helpers } from 'victory-core';
import {
  ChartLegend,
  ChartLabel,
  getTheme,
  getLegendTooltipDataProps,
  getLegendTooltipVisibleData,
  ChartLegendTooltipStyles,
  getLegendTooltipSize,
  getLegendTooltipVisibleText,
  ChartLegendTooltipContentProps,
  ChartLegendLabelProps,
  ChartLegendTooltipProps,
  ChartCursorTooltip,
  ChartTooltip,
} from '@patternfly/react-charts';

export const ChartLegendTooltipContent: React.FunctionComponent<ChartLegendTooltipContentProps & {
  stack?: boolean;
}> = ({
  activePoints,
  center,
  dx = 0,
  dy = 0,
  flyoutHeight,
  flyoutWidth,
  height,
  labelComponent = <ChartLegendTooltipLabel />,
  legendComponent = <ChartLegend />,
  legendData,
  text,
  themeColor,
  themeVariant,
  title,
  titleComponent = <ChartLabel />,
  width,
  stack,
  // destructure last
  theme = getTheme(themeColor, themeVariant),
  ...rest
}) => {
  const pointerLength = theme && theme.tooltip ? theme.tooltip.pointerLength : 10;
  const legendProps = getLegendTooltipDataProps(legendComponent.props);
  const visibleLegendData = getLegendTooltipVisibleData({
    activePoints,
    colorScale: legendProps.colorScale,
    legendData,
    text,
    theme,
  });

  if (stack) {
    visibleLegendData.reverse();
  } else {
    visibleLegendData.shift();
  }

  // Component offsets
  const legendOffsetX = 0;
  const legendOffsetY = title ? 9 : -10;
  const titleOffsetX = 10;
  const titleOffsetY = 0;

  // Returns x position of flyout
  const getX = () => {
    if (!(center || flyoutWidth || width)) {
      const x = (rest as any).x;
      return x ? x : undefined;
    }
    const _flyoutWidth = Helpers.evaluateProp(flyoutWidth);
    if (width > center.x + _flyoutWidth + pointerLength) {
      return center.x + ChartLegendTooltipStyles.flyout.padding / 2;
    } else if (center.x < _flyoutWidth + pointerLength) {
      return ChartLegendTooltipStyles.flyout.padding / 2 - pointerLength;
    }
    return center.x - _flyoutWidth;
  };

  // Returns y position
  const getY = () => {
    if (!(center || flyoutHeight || height)) {
      const y = (rest as any).y;
      return y ? y : undefined;
    }
    const _flyoutHeight = Helpers.evaluateProp(flyoutHeight);
    if (center.y < _flyoutHeight / 2) {
      return ChartLegendTooltipStyles.flyout.padding / 2;
    } else if (center.y > height - _flyoutHeight / 2) {
      return height - _flyoutHeight + ChartLegendTooltipStyles.flyout.padding / 2;
    }
    return center.y - _flyoutHeight / 2 + ChartLegendTooltipStyles.flyout.padding / 2;
  };

  // Min & max dimensions do not include flyout padding
  const maxLegendDimensions = getLegendTooltipSize({
    legendData: visibleLegendData,
    legendProps,
    text: getLegendTooltipVisibleText({ activePoints, legendData, text }),
    theme,
  });
  const minLegendDimensions = getLegendTooltipSize({
    legendData: [{ name: '' }],
    legendProps,
    theme,
  });

  // Returns the label component
  const getLabelComponent = () =>
    React.cloneElement(labelComponent, {
      dx: maxLegendDimensions.width - minLegendDimensions.width,
      legendData: visibleLegendData,
      ...labelComponent.props,
    });

  // Returns the title component
  const getTitleComponent = () => {
    const _title = title instanceof Function ? title(activePoints) : title;

    return React.cloneElement(titleComponent, {
      style: {
        fill: ChartLegendTooltipStyles.label.fill,
      },
      text: _title,
      textAnchor: 'start',
      x: getX() + titleOffsetX + Helpers.evaluateProp(dx),
      y: getY() + titleOffsetY + Helpers.evaluateProp(dy),
      ...titleComponent.props,
    });
  };

  const tooltipLegendData = getLegendTooltipVisibleData({
    activePoints,
    colorScale: legendProps.colorScale,
    legendData,
    text,
    textAsLegendData: true,
    theme,
  });

  if (stack) {
    tooltipLegendData.reverse();
  } else {
    tooltipLegendData.shift();
  }

  // Returns the legebd component
  const getLegendComponent = () =>
    React.cloneElement(legendComponent, {
      data: tooltipLegendData,
      labelComponent: getLabelComponent(),
      standalone: false,
      theme,
      x: getX() + legendOffsetX + Helpers.evaluateProp(dx),
      y: getY() + legendOffsetY + Helpers.evaluateProp(dy),
      ...legendProps,
    });

  return (
    <>
      {getTitleComponent()}
      {getLegendComponent()}
    </>
  );
};
ChartLegendTooltipContent.displayName = 'ChartLegendTooltipContent';

export const ChartLegendTooltipLabel: React.FunctionComponent<ChartLegendLabelProps> = ({
  index = 0,
  legendData,
  style,
  text,
  textAnchor = 'start',
  x,
  y,

  // destructure last
  ...rest
}: ChartLegendLabelProps) => {
  const getStyle = (styles: any) => {
    const applyDefaultStyle = (customStyle: React.CSSProperties) =>
      defaults(
        {
          ...customStyle,
        },
        {
          fill: ChartLegendTooltipStyles.label.fill,
        },
      );
    return Array.isArray(styles) ? styles.map(applyDefaultStyle) : applyDefaultStyle(styles);
  };

  const label = legendData && legendData.length ? legendData[index as any].name : undefined;
  return (
    <ChartLabel
      style={getStyle(style)}
      text={`${text} ${label}`}
      textAnchor={textAnchor}
      x={x}
      y={y}
      {...rest}
      dx={undefined}
    />
  );
};
ChartLegendTooltipLabel.displayName = 'ChartLegendTooltipLabel';

export const ChartLegendTooltip: React.FunctionComponent<ChartLegendTooltipProps & {
  stack?: boolean;
}> = ({
  activePoints,
  datum,
  center = { x: 0, y: 0 },
  flyoutHeight,
  flyoutWidth,
  height,
  isCursorTooltip = true,
  labelComponent = <ChartLegendTooltipContent />,
  legendData,
  text,
  themeColor,
  themeVariant,
  title,
  width,

  // destructure last
  theme = getTheme(themeColor, themeVariant),
  stack,
  ...rest
}) => {
  const pointerLength = theme && theme.tooltip ? theme.tooltip.pointerLength : 10;
  const ap = stack ? activePoints : activePoints.slice(1);
  const legendTooltipProps = {
    legendData: getLegendTooltipVisibleData({ activePoints: ap, legendData, text, theme }),
    legendProps: getLegendTooltipDataProps(labelComponent.props.legendComponent),
    text: getLegendTooltipVisibleText({ activePoints: ap, legendData, text }),
    theme,
  };

  // Returns flyout height based on legend size
  const getFlyoutHeight = () => {
    const _flyoutHeight =
      getLegendTooltipSize(legendTooltipProps).height + ChartLegendTooltipStyles.flyout.padding;
    return title ? _flyoutHeight + 4 : _flyoutHeight - 10;
  };

  // Returns flyout width based on legend size
  const getFlyoutWidth = () =>
    getLegendTooltipSize(legendTooltipProps).width +
    ChartLegendTooltipStyles.flyout.padding +
    (stack ? 20 : 0);

  // Returns the tooltip content component
  const getTooltipContentComponent = () =>
    React.cloneElement(labelComponent, {
      center,
      flyoutHeight: flyoutHeight || getFlyoutHeight(),
      flyoutWidth: flyoutWidth || getFlyoutWidth(),
      height,
      legendData,
      title,
      width,
      stack,
      ...labelComponent.props,
    });

  // Returns the tooltip component
  const getTooltipComponent = () => {
    const _flyoutWidth = getFlyoutWidth();
    const tooltipComponent = isCursorTooltip ? <ChartCursorTooltip /> : <ChartTooltip />;
    return React.cloneElement(tooltipComponent, {
      activePoints,
      center,
      datum,
      flyoutHeight: flyoutHeight || getFlyoutHeight(),
      flyoutWidth: flyoutWidth || getFlyoutWidth(),
      height,
      labelComponent: getTooltipContentComponent(),
      ...(flyoutWidth === undefined && {
        showPointer:
          width > _flyoutWidth + center.x + pointerLength ||
          center.x > _flyoutWidth + pointerLength,
      }),
      text,
      theme,
      width,
      ...rest,
    });
  };

  return getTooltipComponent();
};
ChartLegendTooltip.displayName = 'ChartLegendTooltip';
