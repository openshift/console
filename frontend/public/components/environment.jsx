import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { k8sPatch, k8sGet, referenceFor } from '../module/k8s';
import { PromiseComponent, NameValueEditorPair, LoadingBox, AsyncComponent, ResourceIcon } from './utils';
import { ConfigMapModel, SecretModel } from '../models';

/**
 * Set up an AsyncComponent to wrap the name-value-editor to allow on demand loading to reduce the
 * vendor footprint size.
 */
const NameValueEditorComponent = (props) => <AsyncComponent loader={() => import('./utils/name-value-editor.jsx').then(c => c.NameValueEditor)} {...props} />;

/**
 * Set up initial value for the environment vars state. Use this in constructor or cancelChanges.
 *
 * @param initialPairObjects
 * @returns {*}
 * @private
 */
const getPairsFromObject = (element) => {
  if (_.isUndefined(element.env)) {
    return [['', '', 0]];
  }
  return _.map(element.env, (leafNode, i) => {
    if (!_.has(leafNode, 'value') && !_.has(leafNode, 'valueFrom')) {
      leafNode.value = '';
    }
    leafNode.ID = i;
    return Object.values(leafNode);
  });
};

/**
 * Get name/value pairs from an array or object source
 *
 * @param initialPairObjects
 * @returns {Array}
 */
export const envVarsToArray = (initialPairObjects) => {
  if (_.isArray(initialPairObjects)) {
    return _.map(initialPairObjects, (element) => {
      return getPairsFromObject(element);
    });
  }
  return [getPairsFromObject(initialPairObjects)];
};

/** @type {(state: any, props: {obj: object, rawEnvData: any, readOnly: boolean, envPath: any}) => {model: K8sKind}} */
const stateToProps = ({k8s}, {obj}) => ({
  model: k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]) || k8s.getIn(['RESOURCES', 'models', obj.kind]),
});

export const EnvironmentPage = connect(stateToProps)(
  class EnvironmentPage extends PromiseComponent {
  /**
   * Set initial state and decide which kind of env we are setting up
   *
   * @param props
   */
    constructor(props) {
      super(props);

      this.reload = this._reload.bind(this);
      this.saveChanges = this._saveChanges.bind(this);
      this.updateEnvVars = this._updateEnvVars.bind(this);

      const currentEnvVars = envVarsToArray(this.props.rawEnvData);
      this.state = {
        currentEnvVars,
        success: null
      };
    }

    componentDidMount() {
      super.componentDidMount();

      const {readOnly} = this.props;
      if (readOnly) {
        const configMaps={}, secrets = {};
        this.setState({configMaps, secrets});
        return;
      }
      const envNamespace = _.get(this.props, 'obj.metadata.namespace');

      Promise.all([
        k8sGet(ConfigMapModel, null, envNamespace).catch((err) => {
          if (err.response.status !== 403) {
            const errorMessage = err.message || 'Could not load config maps.';
            this.setState({ errorMessage });
          }
          return {
            configMaps: {}
          };
        }),
        k8sGet(SecretModel, null, envNamespace).catch((err) => {
          if (err.response.status !== 403) {
            const errorMessage = err.message || 'Could not load secrets.';
            this.setState({ errorMessage });
          }
          return {
            secrets: {}
          };
        })
      ])
        .then(_.spread((configMaps, secrets) => this.setState({configMaps, secrets})));
    }
    /**
     * Return env var pairs in name value notation, and strip out any pairs that have empty NAME values.
     *
     *
     * @param finalEnvPairs
     * @returns {Array}
     * @private
     */
    _envVarsToNameVal(finalEnvPairs) {
      return _.filter(finalEnvPairs, finalEnvPair => !_.isEmpty(finalEnvPair[NameValueEditorPair.Name]))
        .map(finalPairForContainer => {
          if (finalPairForContainer[NameValueEditorPair.Value] instanceof Object) {
            return {
              'name': finalPairForContainer[NameValueEditorPair.Name],
              'valueFrom': finalPairForContainer[NameValueEditorPair.Value]
            };
          }
          return {
            'name': finalPairForContainer[NameValueEditorPair.Name],
            'value': finalPairForContainer[NameValueEditorPair.Value]
          };
        });
    }

    /**
     * Callback for NVEditor update our state with new values
     * @param env
     * @param i
     */
    _updateEnvVars(env, i=0) {
      const {rawEnvData} = this.props;
      const {currentEnvVars} = this.state;
      const currentEnv = currentEnvVars;
      currentEnv[i] = env.nameValuePairs;
      const modified = !_.isEqual(currentEnv, envVarsToArray(rawEnvData));
      this.setState({
        currentEnvVars: currentEnv,
        success: null,
        modified,
      });
    }

    /**
     * Reset the page to initial state
     * @private
     */
    _reload() {
      const {rawEnvData} = this.props;
      this.setState({
        currentEnvVars: envVarsToArray(rawEnvData),
        errorMessage: null,
        success: null,
        modified: false,
        stale: false
      });
    }

    /**
     * Build out our currentEnvVars state object from our incoming props.
     * If there is a change and are read/write let the user know we have updated vars otherwise just refresh the page.
     * For no change return null
     *
     * @param nextProps
     * @param prevState
     */
    static getDerivedStateFromProps(nextProps, prevState) {
      const { currentEnvVars } = prevState;
      const { rawEnvData, readOnly } = nextProps;
      const incomingEnvVars = envVarsToArray(rawEnvData);
      if (_.isEqual(incomingEnvVars, currentEnvVars)) {
        return null;
      }
      return readOnly ? { currentEnvVars: incomingEnvVars } : { stale: true, success: null };
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
      const {envPath, rawEnvData, obj, model} = this.props;
      const {currentEnvVars} = this.state;
      e.preventDefault();

      const patch = currentEnvVars.map((finalPairsForContainer, i) => {
        let op = 'add';
        const path = _.isArray(rawEnvData) ? `/${envPath.join('/')}/${i}/env` : `/${envPath.join('/')}/env`;
        if (_.isArray(rawEnvData)) {
          if (rawEnvData[i].env) {
            op = 'replace';
          }
        } else {
          if (rawEnvData.env) {
            op = 'replace';
          }
        }
        return {path, op, value: this._envVarsToNameVal(finalPairsForContainer)};
      });
      const promise = k8sPatch(model, obj, patch);
      this.handlePromise(promise).then((res) => {
        const newEnvData = _.get(res, envPath);
        this.setState({
          success: 'Successfully updated the environment variables.',
          errorMessage: null,
          currentEnvVars: envVarsToArray(newEnvData),
          modified: false,
          stale: false
        });
      });
    }

    render() {
      const {errorMessage, success, inProgress, currentEnvVars, stale, configMaps, secrets} = this.state;
      const {rawEnvData, readOnly, obj} = this.props;

      if (!configMaps || !currentEnvVars || !secrets) {
        return <LoadingBox />;
      }
      const containerVars = currentEnvVars.map((envVar, i) => {
        const keyString = _.isArray(rawEnvData) ? rawEnvData[i].name : obj.metadata.name;
        return <div key={keyString} className="co-m-pane__body-group">
          { _.isArray(rawEnvData) && <h2 className="co-section-heading co-section-heading--contains-resource-icon"><ResourceIcon kind="Container" className="co-m-resource-icon--align-left co-m-resource-icon--flex-child" /> {keyString}</h2> }
          <NameValueEditorComponent nameValueId={i} nameValuePairs={envVar} updateParentData={this.updateEnvVars} addString="Add Value" nameString="Name" readOnly={readOnly} allowSorting={true} configMaps={configMaps} secrets={secrets} />
        </div>;
      });

      return <div className="co-m-pane__body">
        { !readOnly &&
            <p className="co-m-pane__explanation">Define environment variables as key-value pairs to store configuration settings. You can enter text or add values from a ConfigMap or Secret. Drag and drop environment variables to change the order in which they are run. A variable can reference any other variables that come before it in the list, for example <code>FULLDOMAIN = $(SUBDOMAIN).example.com</code>.</p>
        }
        {containerVars}
        <div className="co-m-pane__body-group">
          <div className="environment-buttons">
            {errorMessage && <p className="alert alert-danger"><span className="pficon pficon-error-circle-o" aria-hidden="true"></span>{errorMessage}</p>}
            {stale && <p className="alert alert-info"><span className="pficon pficon-info" aria-hidden="true"></span>The information on this page is no longer current. Click Reload to update and lose edits, or Save Changes to overwrite.</p>}
            {success && <p className="alert alert-success"><span className="pficon pficon-ok" aria-hidden="true"></span>{success}</p>}
            {!readOnly && <button disabled={inProgress} type="submit" className="btn btn-primary" onClick={this.saveChanges}>Save Changes</button>}
            {!readOnly && <button disabled={inProgress} type="button" className="btn btn-default" onClick={this.reload}>Reload</button>}
          </div>
        </div>
      </div>;
    }
  });
EnvironmentPage.propTypes = {
  obj: PropTypes.object.isRequired,
  rawEnvData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  envPath: PropTypes.array.isRequired,
  readOnly: PropTypes.bool.isRequired
};
