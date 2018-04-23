import * as React from 'react';
import * as PropTypes from 'prop-types';

import { ValueFromPair } from './value-from-pair';

export const NAME = 0;
export const VALUE = 1;

export class NameValueEditor extends React.Component {
  constructor (props) {
    super(props);
    this._append = this._append.bind(this);
    this._remove = this._remove.bind(this);
    this._change = this._change.bind(this);

  }

  _append() {
    const {updateParentData, nameValuePairs, nameValueId} = this.props;

    updateParentData({nameValuePairs: nameValuePairs.concat([['', '']])}, nameValueId);
  }

  _remove(i) {
    const {updateParentData, nameValuePairs, nameValueId} = this.props;

    nameValuePairs.splice(i, 1);
    updateParentData({nameValuePairs: nameValuePairs.length ? nameValuePairs : [['', '']]}, nameValueId);
  }

  _change(e, i, type) {
    const {updateParentData, nameValuePairs, nameValueId} = this.props;

    nameValuePairs[i][type === NAME ? NAME : VALUE] = e.target.value;
    updateParentData({nameValuePairs}, nameValueId);
  }

  render () {
    const {nameString, valueString, addString, nameValuePairs, allowSorting, readOnly} = this.props;
    const pairElems = nameValuePairs.map((pair, i) =>
      <div className="row pairs-list__row" key={i}>
        <div className="col-xs-5 pairs-list__field">
          <input type="text" className="form-control" placeholder={nameString.toLowerCase()} value={pair[NAME]} onChange={e => this._change(e, i, NAME)} disabled={readOnly} />
        </div>
        <div className="col-xs-6 pairs-list__field">
          {
            (pair[VALUE] instanceof Object) ?
              <ValueFromPair pair={pair[VALUE]}/> :
              <input type="text" className="form-control" placeholder={valueString.toLowerCase()} value={pair[VALUE] || ''} onChange={e => this._change(e, i, VALUE)} disabled={readOnly}/>
          }
        </div>
        {
          readOnly ?
            null :
            allowSorting ?
              <div className="col-xs-1">
                <span className="pairs-list__span-btns">
                  <i className="fa fa-bars pairs-list__reorder-icon"></i>
                  <i className="fa fa-minus-circle pairs-list__btn pairs-list__delete-icon" onClick={() => this._remove(i)}></i>
                </span>
              </div> :
              <div className="col-xs-1">
                <i className="fa fa-minus-circle pairs-list__btn pairs-list__delete-icon" onClick={() => this._remove(i)}></i>
              </div>
        }
      </div>);

    return (<div>
      <div className="row">
        <div className="col-xs-5 text-secondary">{nameString.toUpperCase()}</div>
        <div className="col-xs-6 text-secondary">{valueString.toUpperCase()}</div>
      </div>
      {pairElems}
      <div className="row">
        <div className="col-xs-12">
          {
            readOnly ?
              null :
              <div className="btn-link pairs-list__btn" onClick={this._append}>
                <i className="fa fa-plus-circle pairs-list__add-icon"></i>{addString}
              </div>
          }
        </div>
      </div>
    </div>);
  }
}
NameValueEditor.propTypes = {
  nameString: PropTypes.string,
  valueString: PropTypes.string,
  addString: PropTypes.string,
  allowSorting: PropTypes.bool,
  readOnly: PropTypes.bool,
  nameValueId: PropTypes.number,
  nameValuePairs: PropTypes.array.isRequired,
  updateParentData: PropTypes.func.isRequired
};
NameValueEditor.defaultProps = {
  nameString: 'Key',
  valueString: 'Value',
  addString: 'Add More',
  allowSorting: false,
  readOnly: false,
  nameValueId: 0
};
