import React from 'react';
import ReactDOM from 'react-dom';
import Chart from './chart';

class ReactChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: 0
    };
  }

  componentDidMount() {
    var el = ReactDOM.findDOMNode(this);
    this.chart = new Chart(el, {
      height: 60,
      limit: this.props.limit,
      units: this.props.units
    }, this.getChartState());

    this.handleResize();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  componentDidUpdate() {
    var el = ReactDOM.findDOMNode(this);
    this.chart.update(el, this.getChartState());
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  handleResize() {
    this.setState({
      width: ReactDOM.findDOMNode(this).offsetWidth
    });
  }

  getChartState() {
    return {
      data: _.cloneDeep(this.props.data),
      width: this.state.width
    };
  }

  render() {
    return (
      <div className="graph"></div>
    );
  }
}
ReactChart.propTypes = {
  data: React.PropTypes.array,
  limit: React.PropTypes.number,
  units: React.PropTypes.string
}

export default ReactChart;
