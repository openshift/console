import React from 'react';
import ReactDOM from 'react-dom';

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

    let chart = d3.select(el);
    
    const chartM = width / 2 * 0.14;
    const chartR = width / 2 * 0.85;
    
    let adjustedData = [];
    let total = 0;
    data.map(function(entry) {
      total += entry.value;
    });

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
    
    let topG = chart.append('svg:svg')
      .attr('width', (chartR + chartM) * 2)
      .attr('height', (chartR + chartM) * 2)
      .append('svg:g')
      .attr('class', 'donut')
      .attr('transform', `translate(${chartR+chartM}, ${chartR+chartM})`);

    // `translate(${chartR+chartM}, ${chartR+chartM})`

    let arc = d3.arc()
      .innerRadius(chartR * 0.6)
      .outerRadius(function(d, i) {
        return i === adjustedData.length - 1 ? chartR * 1.2 : chartR * 1;
      });

    let pie = d3.pie()
      .sort(null)
      .value(function(d) {
        return d.value;
      });

    let reversed = adjustedData.reverse();
    let g = topG.selectAll('.arc')
      .data(pie(reversed))
      .enter().append('g')
      .attr('class', 'arc');

    g.append('path')
      .attr('d', arc)
      .style('stroke', '#fff')
      .style('fill', function(d) {
        return d.data.color;
      });

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
    return <span className="donut-chart" ref={node => this.node = node}></span>;
    //return <div className="chart" ref={node => this.node = node}></div>;
  }
}
