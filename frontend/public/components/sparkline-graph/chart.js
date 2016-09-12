import d3 from 'd3';
import moment from 'moment';
import units from '../utils/units';

class Chart {
  constructor(el, props, state) {
    this.props = props;
    this._bisectDate = d3.bisector((d) => d.date).left;
    this._id = _.uniqueId('sparkline-');

    this.initSvg(el);
    this.update(el, state);
  }

  update(el, state) {
    let scales = this._scales(state.width);
    this._drawPoints(el, scales, state.data);
    this._drawTooltips(el, scales, state.data);
  }

  initSvg(el) {
    this.svg = d3.select(el).append('svg')
        .attr({
          height: '100%',
          width: '100%'
        });

    let defs = this.svg.append('defs');
    let linearGradient = defs.append('linearGradient')
                              .attr('id', this._id + '-gradient');
    linearGradient
        .attr({
          x1: '0',
          y1: '0',
          x2: '0',
          y2: '1'
        });
    linearGradient.append('stop')
        .attr({
          offset: '0%',
          'stop-color': '#0f84d1',
          'stop-opacity': 1
        });
    linearGradient.append('stop')
        .attr({
          offset: '100%',
          'stop-color': '#b6e2ff',
          'stop-opacity': 1
        });

    defs.append('clipPath')
        .attr('id', this._id + '-clip-path')
        .append('path')
          .attr('class', 'area');

    this.svg.append('rect')
        .attr({
          x: 0,
          y: 0,
          width: '100%',
          height: '100%',
          fill: 'url(' + window.location.pathname + '#' + this._id + '-gradient)',
          'fill-opacity': 0.5,
          'clip-path': 'url(' + window.location.pathname + '#' + this._id + '-clip-path'
        });

    this.svg.append('line')
        .attr({
          class: 'limit-line limit-line-before',
          x1: '0',
          x2: '3'
        })
        .style('display', 'none');
    this.svg.append('line')
        .attr('class', 'limit-line limit-line-after')
        .style('display', 'none');
    this.svg.append('text')
        .attr('class', 'limit-text')
        .style('display', 'none');

    let tipGroup = this.svg.append('g')
        .attr('class', 'tip-group')
        .style('display', 'none');

    // append the circle at the intersection
    tipGroup.append('circle')
        .attr({
          class: 'tip',
          r: 3
        });

    let tipTextGroup = tipGroup.append('g')
        .attr('class', 'tip-text-group');

    // place the value at the intersection
    tipTextGroup.append('text')
        .attr({
          class: 'value tip-shadow',
          dx: 8,
          dy: '-.3em'
        });
    tipTextGroup.append('text')
        .attr({
          class: 'value tip-data',
          dx: 8,
          dy: '-.3em'
        });

    // place the date at the intersection
    tipTextGroup.append('text')
        .attr({
          class: 'date tip-shadow',
          dx: 8,
          dy: '1em'
        });
    tipTextGroup.append('text')
        .attr({
          class: 'date tip-data',
          dx: 8,
          dy: '1em'
        });

    // place the rectangle to capture mouse events
    this.svg.append('rect')
        .attr({
          class: 'mouse-trigger',
          width: '100%',
          height: '100%'
        })
        .style({
          fill: 'none',
          'pointer-events': 'all'
        })
        .on({
          mouseover: () => tipGroup.style('display', null),
          mouseout: () => tipGroup.style('display', 'none')
        });
  }

  _scales(width) {
    let x = d3.time.scale()
        .range([0, width]);

    let y = d3.scale.linear()
        .range([this.props.height, 0]);

    return { x, y };
  };

  _drawPoints(el, scales, data) {
    let area = d3.svg.area()
        .x((d) => scales.x(d.date))
        .y0(this.props.height)
        .y1((d) => scales.y(d.value));

    data.forEach(function(d) {
      d.date = new Date(d.date * 1000);
      d.value = +d.value;
    });

    let max = d3.max(data, (d) => d.value);

    if (this.props.limit > 0) {
      max = Math.max(max, this.props.limit * 1.2);
    } else {
      max = max * 1.5;
    }

    scales.x.domain(d3.extent(data, (d) => d.date));
    scales.y.domain([0, max]);

    this.svg.select('path.area')
        .datum(data)
        .attr('d', area);

    if (this.props.limit) {
      const y = scales.y(this.props.limit);
      const limitText = this.svg.select('text.limit-text')
          .style('display', null)
          .attr({
            x: 5,
            y: y + 2.5
          })
          .text(this._valueInUnits(this.props.limit) + ' limit');
      const limitTextBox = limitText.node().getBBox();

      this.svg.selectAll('line.limit-line')
        .style('display', null)
        .attr({
          y1: y,
          y2: y
        });
      this.svg.select('line.limit-line-after')
        .attr({
          x1: limitTextBox.x + limitTextBox.width + 3,
          x2: '100%'
        });
    } else {
      this.svg.selectAll('path.limit-line').style('display', 'none');
      this.svg.select('text.limit-text').style('display', 'none');
    }
  }

  _valueInUnits(value) {
    return units.humanize(value, this.props.units, true).string
  }

  _drawTooltips(el, scales, data) {
    this.svg.select('rect.mouse-trigger').on('mousemove', mousemove);

    let that = this;

    function mousemove() {
      const x0 = scales.x.invert(d3.mouse(this)[0]),
          i  = that._bisectDate(data, x0, 1),
          d0 = data[i - 1],
          d1 = data[i],
          d  = x0 - d0.date > d1.date - x0 ? d1 : d0;

      const translateX = scales.x(d.date);
      const translateY = scales.y(d.value);

      const tipValue = that._valueInUnits(d.value);

      let tipGroup = that.svg.select('g.tip-group');
      let tipTextGroup = that.svg.select('g.tip-text-group');

      tipGroup.select('circle.tip')
          .attr('transform', 'translate(' + translateX + ',' + translateY + ')');

      tipTextGroup.select('text.value.tip-shadow')
          .text(tipValue);

      tipTextGroup.select('text.value.tip-data')
          .text(tipValue);

      tipTextGroup.select('text.date.tip-shadow')
          .text(moment(d.date).format('MMM DD, h:mm a'));

      tipTextGroup.select('text.date.tip-data')
          .text(moment(d.date).format('MMM DD, h:mm a'));

      const textTranslateY = Math.max(Math.min(translateY, 45), 15);
      let textTranslateX = translateX;
      let textAnchor = 'start';
      const bbox = tipTextGroup.node().getBBox()
      if (translateX + bbox.width + 15 >= el.offsetWidth) {
        textAnchor = 'end';
        textTranslateX = textTranslateX - 16;
      }
      tipTextGroup.attr({
        'text-anchor': textAnchor,
        transform: 'translate(' + textTranslateX + ',' + textTranslateY + ')'
      });
    }
  }
}

export default Chart;
