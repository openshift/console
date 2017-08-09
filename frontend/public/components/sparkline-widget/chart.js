// All d3-specific logic surrounding how we generate
// the actual chart

import * as d3 from 'd3';
import moment from 'moment';

import { units } from '../utils';

class Chart {
  constructor(el, props, state) {
    this.height = props.height;
    this.limit = props.limit;
    this.limitText = props.limitText;
    this.units = props.units;
    this.timespan = props.timespan;
    this._bisectDate = d3.bisector((d) => d.date).left;

    this.initSvg(el);
    this.update(el, state);
  }

  update(el, state) {
    const data = this._processData(state.data);
    const scales = this._scales(state.width);
    this._drawPoints(el, scales, data);
    this._drawTooltips(el, scales, data);
  }

  initSvg(el) {
    this.svg = d3.select(el).select('svg');

    const tipGroup = this.svg.select('.chart__tip-group');
    this.svg.select('.chart__mouse-trigger')
      .on('mouseover', () => tipGroup.style('display', null))
      .on('mouseout', () => tipGroup.style('display', 'none'));
  }

  _processData(data) {
    return data.map((d) => {
      return {
        date: new Date(d.date * 1000),
        value: +d.value
      };
    });
  }

  _scales(width) {
    const x = d3.scaleTime()
      .range([0, width]);

    const y = d3.scaleLinear()
      .range([this.height, 0]);

    return { x, y };
  }

  _drawPoints(el, scales, data) {
    const area = d3.area()
      .x((d) => scales.x(d.date))
      .y0(this.height)
      .y1((d) => scales.y(d.value));

    let yMax = d3.max(data, (d) => d.value);

    if (this.limit > 0) {
      yMax = Math.max(yMax * 1.025, this.limit * 1.2);
    } else {
      yMax = yMax * 1.5;
    }

    const now = Date.now();
    const lastDataPoint = data[data.length - 1];
    // if the lastest data we have is within 45 seconds, don't visually show the gap
    const xMax = (Date.now() - lastDataPoint.date <= 45 * 1000) ? lastDataPoint.date : now;
    const xMin = xMax - this.timespan;

    scales.x.domain([xMin, xMax]);
    scales.y.domain([0, yMax]);

    this.svg.select('.chart__area')
      .datum(data)
      .attr('d', area);

    if (this.limit) {
      const y = scales.y(this.limit);
      const text = `${this._valueInUnits(this.limit)} ${this.limitText}`;
      this.svg.selectAll('.chart__limit-text')
        .style('display', null)
        .attr('x', 5)
        .attr('y', y + 2.5)
        .text(text);
      const limitTextBox = this.svg.select('.chart__limit-text--text').node().getBBox();

      this.svg.selectAll('.chart__limit-line')
        .style('display', null)
        .attr('y1', y)
        .attr('y2', y);
      this.svg.select('.chart__limit-line-after')
        .attr('x1', limitTextBox.x + limitTextBox.width + 3)
        .attr('x2', '100%');
    } else {
      this.svg.selectAll('.chart__limit-line').style('display', 'none');
      this.svg.selectAll('.chart__limit-text').style('display', 'none');
    }
  }

  _valueInUnits(value) {
    return units.humanize(value, this.units, true).string;
  }

  _drawTooltips(el, scales, data) {
    const mouseTrigger = this.svg.select('.chart__mouse-trigger');
    mouseTrigger.on('mousemove', () => {
      const x0 = scales.x.invert(d3.mouse(mouseTrigger.node())[0]),
          i = this._bisectDate(data, x0),
          d0 = data[i - 1],
          d1 = data[i];

      let d;
      if (d0 && d1) {
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      }
      if (!d || d.value === -1) {
        // there's no data for this point, hide the toolitp
        d = {
          date: -1,
          value: -1
        };
      }

      const translateX = scales.x(d.date);
      const translateY = scales.y(d.value);

      const tipValue = this._valueInUnits(d.value);

      const tipGroup = this.svg.select('.chart__tip-group');
      const tipTextGroup = this.svg.select('.chart__tip-text-group');

      tipGroup.select('.chart__tip')
        .attr('transform', `translate(${translateX},${translateY})`);

      tipTextGroup.select('.chart__value.chart__tip-data')
        .text(tipValue);

      tipTextGroup.select('.chart__date.chart__tip-data')
        .text(moment(d.date).format('MMM DD, h:mm a'));

      const textPadding = {
        top: 7,
        bottom: 5,
        sides: 8
      };
      const textMargin = {
        top: 10,
        sides: 8
      };

      let textAnchor = 'start';
      let textBg = {
        x: translateX + textMargin.sides,
        y: textMargin.top
      };
      let textGroup = {
        x: textBg.x + textPadding.sides,
        y: textBg.y + textPadding.top
      };
      const bbox = tipTextGroup.node().getBBox();
      if (textGroup.x + bbox.width + textMargin.sides + textPadding.sides >= el.offsetWidth) {
        textAnchor = 'end';
        textGroup.x = translateX - textMargin.sides - textPadding.sides;
        textBg.x = translateX - textMargin.sides - textPadding.sides * 2 - bbox.width;
      }

      tipTextGroup
        .attr('text-anchor', textAnchor)
        .attr('transform', `translate(${textGroup.x},${textGroup.y})`);
      tipGroup.select('.chart__tip-text-bg')
        .attr('transform', `translate(${textBg.x},${textBg.y})`)
        .attr('width', bbox.width + textPadding.sides * 2)
        .attr('height', bbox.height + textPadding.top + textPadding.bottom);
    });
  }
}

export default Chart;
