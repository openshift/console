import * as React from 'react';
import * as PropTypes from 'prop-types';

export class ValueFromPair extends React.Component {
  constructor (props) {
    super(props);
    let valueFromKey = Object.keys(this.props.pair)[0];
    let valueFromType = valueFromKey.substring(0,valueFromKey.indexOf('KeyRef'));
    this.state = {
      valueFromText: valueFromType,
      valueFromKey: valueFromKey
    };
  }

  /*
   *
   *  Add These actions on next pr for valueFrom edit functionality
   *
   *
  _change (e, i, type) {
    const {updateParentData, nameValuePairs} = this.props;

    nameValuePairs[i][type === NAME ? NAME : VALUE] = e.target.value;
    updateParentData({nameValuePairs});
  }

  _append = () => {
    const {updateParentData, nameValuePairs} = this.props;

    updateParentData({nameValuePairs: nameValuePairs.concat([['', '']])});
  };

  _remove = (i) => {
    const {updateParentData, nameValuePairs} = this.props;
    nameValuePairs.splice(i, 1);
    updateParentData({nameValuePairs: nameValuePairs.length ? nameValuePairs : [['', '']]});
  };*/

  render () {
    const {pair} = this.props;
    const {valueFromKey, valueFromText} = this.state;

    return (
      <span>
        <input type="text" className="form-control value-from-pair" value={`${pair[valueFromKey].name} - ${valueFromText}`} disabled/>
        <input type="text" className="form-control value-from-pair" value={pair[valueFromKey].key} disabled/>
      </span>
    );
  }
}
ValueFromPair.propTypes = {
  nameString: PropTypes.string,
  valueString: PropTypes.string,
  addString: PropTypes.string,
  allowSorting: PropTypes.bool,
  readOnly: PropTypes.bool,
  pair: PropTypes.object.isRequired,
  nameValuePairs: PropTypes.array.isRequired,
  updateParentData: PropTypes.func.isRequired
};
ValueFromPair.defaultProps = {
  nameString: 'Key',
  valueString: 'Value',
  addString: 'Add More',
  allowSorting: false,
  readOnly: false
};
