import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as d3 from 'd3';

// Donut chart
class Chart {
  constructor(el, props) {
    this.width = props.width;
    this.data = props.data;
    this.update(el);
  }

  update(el) {
    this._drawArcs(el, this.data, this.width, null);
  }

  _drawArcs(el, data, width, minPercent = null) {
    if (!data || !data.length) {
      return;
    }

    let svg = d3.select(el).select('svg');

    const chartM = width / 2 * 0.14;
    const chartR = width / 2 * 0.85;

    let adjustedData = [];
    const total = _.sumBy(data, 'value');

    adjustedData = data.map(function(entry) {
      let value = entry.value;
      if (minPercent) {
        if (value / total < minPercent / 100) {
          value = total * minPercent / 100;
        }
      }

      let copy = _.assign({}, entry);
      copy.value = value;
      return copy;
    });

    let topG = svg
      .attr('width', (chartR + chartM) * 2)
      .attr('height', (chartR + chartM) * 2)
      .append('svg:g')
      .attr('transform', `translate(${chartR+chartM}, ${chartR+chartM})`);

    let arc = d3.arc()
      .innerRadius(chartR * 0.6)
      .outerRadius((d, i) => i === adjustedData.length - 1 ? chartR * 1.2 : chartR * 1);

    let pie = d3.pie()
      .sort(null)
      .value(d => d.value);

    let reversed = adjustedData.reverse();
    let g = topG.selectAll('.arc')
      .data(pie(reversed))
      .enter().append('g')
      .attr('class', 'arc');

    g.append('path')
      .attr('d', arc)
      .style('stroke', '#fff')
      .attr('class', d => d.data.colorClass);
  }
}

export class DonutChart extends React.Component {
  constructor (props) {
    super(props);
  }

  componentDidMount() {
    this.node = this.node;
    this.createChart();
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      this.chart.update(this.node);
    }
  }

  createChart() {
    this.chart = new Chart(this.node, {
      width: this.props.width,
      data: this.props.data
    });
  }

  render () {
    return <span className="donut-chart" ref={node => this.node = node}>
      <svg className="donut"></svg>
    </span>;
  }
}
