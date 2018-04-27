import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as classNames from'classnames';
import { modelFor, k8sPatch } from '../module/k8s';
import { NameValueEditor, NAME, VALUE } from './utils/name-value-editor';
import { PromiseComponent } from './utils';

/**
 * Set up initial value for the environment vars state. Use this in constructor or cancelChanges.
 *
 * @param initialPairObjects
 * @returns {*}
 * @private
 */
const getPairsFromObject = (element) => {
  let leafPairs = [];
  if (typeof element.env === 'undefined') {
    leafPairs.push(['', '']);
  } else {
    element.env.forEach((leafNode) => {
      leafPairs.push(Object.values(leafNode));
    });
  }
  return leafPairs;
};

/**
 * Get name/value pairs from an array source
 *
 * @param initialPairObjects
 * @returns {Array}
 */
const envVarsToArrayForArray = (initialPairObjects) => {
  let initialPairs = [];
  initialPairObjects.forEach((element) => {
    initialPairs.push(getPairsFromObject(element));
  });
  return initialPairs;
};

/**
 * Get name/value pairs from an object source
 *
 * @param initialPairObjects
 * @returns {Array}
 */
const envVarsToArrayForObject = (initialPairObjects) => {
  let initialPairs = [];
  initialPairs.push(getPairsFromObject(initialPairObjects));
  return initialPairs;
};

/**
 * Env setup utility function.
 * TODO: JCC use referenceForModel and referenceFor when these have been adjusted for v1 k8s resources
 *
 * @type {function()}
 * @private
 */
const getEnvForKind = (obj) => {
  let envSourceObject = {};
  switch(obj.kind) {
    case 'Pod':
      envSourceObject.envVars = envVarsToArrayForArray(obj.spec.containers);
      envSourceObject.rawEnvData = obj.spec.containers;
      envSourceObject.envPath = '/spec/containers';
      envSourceObject.readOnly = true;
      envSourceObject.isBuildObject = false;
      break;
    case 'BuildConfig':
      envSourceObject.envVars = envVarsToArrayForObject(obj.spec.strategy.sourceStrategy);
      envSourceObject.rawEnvData = obj.spec.strategy.sourceStrategy;
      envSourceObject.envPath = '/spec/strategy/sourceStrategy';
      envSourceObject.readOnly = false;
      envSourceObject.isBuildObject = true;
      break;
    default:
      envSourceObject.envVars = envVarsToArrayForArray(obj.spec.template.spec.containers);
      envSourceObject.rawEnvData = obj.spec.template.spec.containers;
      envSourceObject.envPath = '/spec/template/spec/containers';
      envSourceObject.readOnly = false;
      envSourceObject.isBuildObject = false;
      break;

  }
  return envSourceObject;
};

export class EnvironmentPage extends PromiseComponent {
  /**
   * Set initial state and decide which kind of env we are setting up
   *
   * @param props
   */
  constructor(props) {
    super(props);

    this.clearChanges = () => this._clearChanges();
    this.saveChanges = (...args) => this._saveChanges(...args);
    this.updateEnvVars = (...args) => this._updateEnvVars(...args);

    let objTypeEnv = getEnvForKind(this.props.obj);

    this.state = {
      ...objTypeEnv,
      success: null
    };
  }

  /**
   * Return env var pairs in name value notation, and strip out any pairs that have empty NAME values.
   * Also stripping out empty VALUE entries...
   * TODO: should we validate here instead of just ignore?
   *
   * @param finalEnvPairs
   * @returns {Array}
   * @private
   */
  _envVarsToNameVal(finalEnvPairs) {
    let pairsToSave = [];
    finalEnvPairs.forEach((finalPairForContainer) => {
      if(!_.isEmpty(finalPairForContainer[NAME]) && !_.isEmpty(finalPairForContainer[VALUE])) {
        if(finalPairForContainer[VALUE] instanceof Object) {
          pairsToSave.push({
            'name': finalPairForContainer[NAME],
            'valueFrom': {
              ...finalPairForContainer[VALUE]
            }
          });
        } else {
          pairsToSave.push({
            'name': finalPairForContainer[NAME],
            'value': finalPairForContainer[VALUE]
          });
        }
      }
    });
    return pairsToSave;
  }

  /**
   * Callback for NVEditor update our state with new values
   * @param env
   * @param i
   */
  _updateEnvVars(env, i=0) {
    const {envVars, rawEnvData, isBuildObject} = this.state;
    const currentEnv = envVars;
    currentEnv[i] = env.nameValuePairs;

    const modified = !_.isEqual(currentEnv, (isBuildObject ? envVarsToArrayForObject(rawEnvData) : envVarsToArrayForArray(rawEnvData)));
    this.setState({
      envVars: currentEnv,
      errorMessage: null,
      success: null,
      modified,
    });
  }

  /**
   * Reset the page to initial state
   * @private
   */
  _clearChanges() {
    const {rawEnvData, isBuildObject} = this.state;
    this.setState({
      envVars: isBuildObject ? envVarsToArrayForObject(rawEnvData) :envVarsToArrayForArray(rawEnvData),
      errorMessage: null,
      success: null
    });
  }

  /**
   * Make it so. Patch the values for the env var changes made on the page.
   * 1. Validate for dup keys
   * 2. Throw out empty rows
   * 3. Use add command if we are adding new env vars, and replace if we are modifying
   * 4. Send the patch command down to REST, and update with response
   *
   * @param e
   */
  _saveChanges(e) {
    const {obj} = this.props;
    const {envPath, envVars, rawEnvData, isBuildObject} = this.state;
    let validationError = null;
    e.preventDefault();

    // Convert any blank values to null
    const kind = modelFor(obj.kind);

    const patch = envVars.map((finalPairsForContainer, i) => {
      const keys = finalPairsForContainer.map(t => t[NAME]);
      if (_.uniq(keys).length !== keys.length) {
        validationError = 'Duplicate keys found.';
        return;
      }
      const path = isBuildObject ? `${envPath}/env` : `${envPath}/${i}/env`;
      const op = (isBuildObject
        ? !rawEnvData.env : typeof rawEnvData[i].env === 'undefined')
        ? 'add' : 'replace';
      return {path, op, value: this._envVarsToNameVal(finalPairsForContainer)};
    });

    if (validationError) {
      this.setState({
        errorMessage: validationError
      });
      return;
    }

    const promise = k8sPatch(kind, obj, patch);
    this.handlePromise(promise).then((res) => {
      const objTypeEnv = getEnvForKind(res);

      this.setState({
        success: 'Successfully updated the environment variables.',
        errorMessage: null,
        ...objTypeEnv
      });
    });
  }

  render() {
    const {envVars, rawEnvData, errorMessage, success, readOnly, inProgress, isBuildObject} = this.state;

    const containerVars = envVars.map((envVar, i) => {
      const keyString = isBuildObject ? rawEnvData.from.name : rawEnvData[i].name;
      return <div key={keyString}>
        { !isBuildObject && <h1 className={classNames('co-section-title', {'environment-section-spacer': i > 0})}>Container {keyString}</h1> }
        <NameValueEditor nameValueId={i} nameValuePairs={envVar} updateParentData={this.updateEnvVars} addString="Add Value" nameString="Name" allowSorting={true} readOnly={readOnly}/>
      </div>;
    });

    return <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="row no-gutter">
          {containerVars}
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <div className="environment-buttons">
          {errorMessage && <p className="alert alert-danger"><span className="pficon pficon-error-circle-o"></span>{errorMessage}</p>}
          {success && <p className="alert alert-success"><span className="pficon pficon-ok"></span>{success}</p>}
          {!readOnly && <button disabled={!this.state.modified || inProgress} type="submit" className="btn btn-primary" onClick={this.saveChanges}>Save Changes</button>}
          {this.state.modified && <button type="button" className="btn btn-link" onClick={this.clearChanges}>Clear Changes</button>}
        </div>
      </div>
    </div>;
  }
}
EnvironmentPage.propTypes = {
  obj: PropTypes.object.isRequired
};
