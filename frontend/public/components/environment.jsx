import * as React from 'react';
import * as _ from 'lodash';
import { modelFor, k8sPatch } from '../module/k8s';
import { NameValueEditor, NAME, VALUE } from './utils/name-value-editor';
import * as PropTypes from 'prop-types';
import { PromiseComponent } from './utils';

/**
 * Set up initial value for the environment vars state. Use this in constructor or cancelChanges.
 *
 * @param initialPairObjects
 * @returns {*}
 * @private
 */
const envVarsToArray = (initialPairObjects) => {
  let initialPairs = [];
  initialPairObjects.forEach((element) => {
    let leafPairs = [];
    if (typeof element.env === 'undefined') {
      leafPairs.push(['', '']);
    } else {
      element.env.forEach((leafNode) => {
        leafPairs.push(Object.values(leafNode));
      });
    }
    initialPairs.push(leafPairs);
  });
  return initialPairs;
};

/**
 * Env setup utility function.
 *
 * @type {function()}
 * @private
 */
const getEnvForKind = (obj) => {
  let envSourceObject = {};
  switch(obj.kind) {
    case 'Pod':
      envSourceObject.envVars = envVarsToArray(obj.spec.containers);
      envSourceObject.rawEnvData = obj.spec.containers;
      envSourceObject.envPath = '/spec/containers';
      envSourceObject.readOnly = true;
      break;
    default:
      envSourceObject.envVars = envVarsToArray(obj.spec.template.spec.containers);
      envSourceObject.rawEnvData = obj.spec.template.spec.containers;
      envSourceObject.envPath = '/spec/template/spec/containers';
      envSourceObject.readOnly = false;
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

    let objTypeEnv = getEnvForKind(this.props.obj);

    this.state = {
      ...objTypeEnv,
      success: null
    };

    /**
     * Return env var pairs in name value notation, and strip out any pairs that have empty NAME values.
     * Also stripping out empty VALUE entries...
     * TODO: should we validate here instead of just ignore?
     *
     * @param finalEnvPairs
     * @returns {Array}
     * @private
     */
    this._envVarsToNameVal = (finalEnvPairs) => {
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
    };

    /**
     * Check for modified values/added/removed rows
     *
     * @returns {boolean}
     * @private
     */
    this._isModified = () => {
      const {envVars, rawEnvData} = this.state;
      return !_.isEqual(envVars, envVarsToArray(rawEnvData));
    };

    /**
     * Callback for NVEditor update our state with new values
     * @param env
     * @param i
     */
    this.updateEnvVars = (env, i=0) => {
      const {envVars} = this.state;
      const currentEnv = envVars;
      currentEnv[i] = env.nameValuePairs;
      this.setState({
        envVars: currentEnv,
        errorMessage: null,
        success: null
      });
    };

    /**
     * Make it so. Patch the values for the env var changes made on the page.
     * 1. Validate for dup keys
     * 2. Throw out empty rows
     * 3. Use add command if we are adding new env vars, and replace if we are modifying
     * 4. Send the patch command down to REST, and update with response
     *
     * @param e
     */
    this.save = (e) => {
      const {obj} = this.props;
      const {envPath, envVars, rawEnvData} = this.state;
      let validationError = null;
      e.preventDefault();

      // Convert any blank values to null
      let patch = [];
      const kind = modelFor(obj.kind);

      envVars.forEach((finalPairsForContainer, i) => {
        const keys = finalPairsForContainer.map(t => t[NAME]);
        if (_.uniq(keys).length !== keys.length) {
          validationError = 'Duplicate keys found.';
          return;
        }
        const patchPath = `${envPath}/${i}/env`;
        const operation = (typeof rawEnvData[i].env === 'undefined') ? 'add' : 'replace';
        patch.push({path: patchPath, op: operation, value: this._envVarsToNameVal(finalPairsForContainer)});
      });

      if(!validationError) {
        const promise = k8sPatch(kind, obj, patch);
        this.handlePromise(promise).then((res) => {
          objTypeEnv = getEnvForKind(res);

          this.setState({
            success: 'Successfully updated the environment variables.',
            errorMessage: null,
            ...objTypeEnv
          });
        });
      } else {
        this.setState({
          errorMessage: validationError
        });
      }
    };

    /**
     * Reset the page to initial state
     * @private
     */
    this._clearChanges = () => {
      const {rawEnvData} = this.state;
      this.setState({
        envVars: envVarsToArray(rawEnvData),
        errorMessage: null,
        success: null
      });
    };

  }

  render() {
    const {envVars, rawEnvData, errorMessage, success, readOnly, inProgress} = this.state;
    const containerVars = envVars.map((envVar, i) =>
      <div key={`div_${i}`}>
        <h1 key={`h1_${i}`} className="co-section-title">Container {rawEnvData[i].name}</h1>
        <NameValueEditor key={`nve_${i}`} nameValuePairs={envVar} updateParentData={this.updateEnvVars} addString="Add Value" nameString={'Name'} allowSorting={true} readOnly={readOnly}/>
      </div>);

    return <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="row no-gutter">
          {containerVars}
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <div className="environment--buttons">
          {errorMessage && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--error">{errorMessage}</p>}
          {success && <p style={{fontSize: '100%'}} className="co-m-message co-m-message--success">{success}</p>}
          {!readOnly && <button disabled={!this._isModified() || inProgress} type="submit" className="btn btn-primary" onClick={(e) => this.save(e)}>Save Changes</button>}
          {this._isModified() && <button type="button" className="btn btn-link" onClick={() => this._clearChanges()}>Clear Changes</button>}
        </div>
      </div>
    </div>;
  }
}
EnvironmentPage.propTypes = {
  obj: PropTypes.object.isRequired
};
