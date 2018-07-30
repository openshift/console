import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import classNames from 'classnames';
import 'patternfly/dist/js/patternfly-settings';

const { patternfly } = window;
import { Donut } from '../graphs';
import { PodUtils } from '../../module/utils/pod-utils';

const POD_COLORS = {
  Empty: patternfly.pfPaletteColors.black100,
  Running: patternfly.pfPaletteColors.lightBlue,
  "Not Ready": patternfly.pfPaletteColors.lightBlue100,
  Warning: patternfly.pfPaletteColors.orange300,
  Error: patternfly.pfPaletteColors.red200,

  Pulling: patternfly.pfPaletteColors.black300,
  ContainerCreating: patternfly.pfPaletteColors.black300,

  Pending: patternfly.pfPaletteColors.black200,
  Succeeded: patternfly.pfPaletteColors.green,
  Terminating: patternfly.pfPaletteColors.blue500,
  Unknown: patternfly.pfPaletteColors.gold200
};

export class AppTopologyPodDonut extends React.Component {
  constructor(props) {
    super(props);

    this.state = this.getCurrentState();
  };

  componentDidUpdate(prevProps) {
    if (this.props.controller !== prevProps.controller) {
      const newState = this.getCurrentState();
      this.setState(newState);
    }
  };

  getCurrentState() {
    const { controller } = this.props;

    if (!controller) {
      return {
        podCount: 0,
        podColumns: []
      }
    }

    const podCountByPhase = PodUtils.getPodPhases(_.get(controller, 'pods'));
    const podCount = PodUtils.getPodCount(_.get(controller, 'pods'));
    let podColumns = [];

    if (_.isEmpty(podCountByPhase)) {
      podColumns.push({label: "Empty", value: _.isEmpty(podCountByPhase) ? 1 : 0});
    } else {
      _.forEach(_.keys(podCountByPhase), key => podColumns.push({label: key, value: podCountByPhase[key]}));
    }

    return { podCount, podColumns };
  };

  render() {
    const { controller, mini } = this.props;
    const { podCount, podColumns } = this.state;

    if (!controller) {
      return null;
    }

    const values = [];
    const labels = [];
    const colors = [];
    const tooltips = [];

    _.forEach(podColumns, column => {
        values.push(column.value);
        labels.push(column.label);
        colors.push(POD_COLORS[column.label]);
        tooltips.push(`${column.label}  ${column.value}`);
    });

    // Add a minimimal value to force a cut-line at the top of the donut.
    values.push(0.005 * podCount);
    labels.push('');
    colors.push(POD_COLORS.Empty);

    const layout = {
      height: mini ? 80 : 150,
      width: mini ? 84 : 154,
      margin: {
        l: 8,
        b: 15,
        r: 10,
        t: 0,
        pad: 0,
      },
      showlegend: false
    };

    const data = {
      hole: .8,
      textposition: 'none',
      hoverinfo: 'text',
      hovertext: tooltips,
      values: values,
      labels: labels
    };

    const chartClasses = classNames('app-topology-pod-donut', 'donut-chart-pf', { mini: mini });

    return (
      <Donut
        className={chartClasses}
        insideText={`${podCount} ${podCount === 1 ? 'Pod' : 'Pods'}`}
        colors={colors}
        layout={layout}
        data={data}
      />
    );
  };
}

AppTopologyPodDonut.defaultProps = {
};

AppTopologyPodDonut.propTypes = {
  id: PropTypes.string.isRequired,
  controller: PropTypes.object,
  mini: PropTypes.bool
};
