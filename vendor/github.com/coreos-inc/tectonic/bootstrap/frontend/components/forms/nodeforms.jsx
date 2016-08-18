import Baby from 'babyparse';
import classNames from 'classnames';
import { Set, List } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';

import { configActionTypes, csvActionTypes, flagActionTypes } from '../../modules/actions';
import { validate } from '../../modules/validate';
import { readFile } from '../../modules/readfile';

import { Input, markIDDirty } from './ui';
import { Pager } from '../pager';

const countBy = (collection, f) => {
  const ret = new Map();
  collection.forEach(obj => {
    const k = f(obj);
    const v = ret.get(k) || 0;
    ret.set(k, v + 1);
  });

  return ret;
};

// label is "Controller" or "Worker"
// index is index of the node
const macFieldID = (label, index) => `nodetable:${label}:${index}:mac`;
const ipFieldID = (label, index) => `nodetable:${label}:${index}:ip`;

const BulkUpload = connect(
  ({csvs}) => {
    return {csvs};
  },
  (dispatch) => {
    return {
      updateCSV: (file, name, contents, columns) => {
        dispatch({
          type: csvActionTypes.SET,
          payload: {
            subject: file,
            value: {name, contents, columns},
          },
        });
      },
      read: (file, blob) => {
        readFile(blob)
        .then(result => {
          const contents = Baby.parse(result);
          dispatch({
            type: csvActionTypes.SET,
            payload: {
              subject: file,
              value: {
                name: blob.name,
                contents: contents,
                columns: {mac: 0, ip: 1},
              },
            },
          });
        })
        .catch((msg) => {
          console.error(msg);
        });
      },
      dirtyAllFields: (label, nodes) => {
        nodes.map((_,i) => {
          const macID = macFieldID(label, i);
          const ipID = ipFieldID(label, i);
          markIDDirty(dispatch, macID);
          markIDDirty(dispatch, ipID);
        });
      },
      cancel: (file) => {
        dispatch({
          type: csvActionTypes.DELETE,
          payload: {
            subject: file,
          },
        });
      },
    };
  }
)(({file, csvs, cancel, close, dirtyAllFields, label, read, updateCSV, updateNodes}) => {
  const csv = csvs.get(file);

  const onUpload = (e) => {
    const blob = e.target.files.item(0);
    read(file, blob);
  };

  const onCancel = () => {
    cancel(file);
    close();
  };

  const onChangeFile = () => {
    cancel(file);
  };

  const onDone = () => {
    const rows = csv.contents.data.slice(1).filter(row => {
      // BabyParse will append a single [""] row to a well-formed CSV,
      // the following happens to fix that, and forgive other
      // possible CSV weirdnesses.
      return row.length > Math.max(csv.columns.ip, csv.columns.mac);
    });
    const nodes = rows.map(row => {
      return {
        ip: row[csv.columns.ip],
        mac: row[csv.columns.mac],
      };
    });
    updateNodes(List(nodes), nodes.length);
    dirtyAllFields(label, nodes);
    cancel(file);
    close();
  };

  const onSelectMACColumn = (e) => {
    const cols = Object.assign({}, csv.columns, {
      mac: parseInt(e.target.value, 10),
    });
    updateCSV(file, csv.name, csv.contents, cols);
  };

  const onSelectIPColumn = (e) => {
    const cols = Object.assign({}, csv.columns, {
      ip: parseInt(e.target.value, 10),
    });
    updateCSV(file, csv.name, csv.contents, cols);
  };

  let body;
  if (csv) {
    const options = csv.contents.data[0].map((txt, ix) => {
      return <option value={ix} key={`${ix}:${txt}`}>{txt}</option>;
    });

    body = (
      <div>
        <div className="row">
          <div className="col-xs-3">
            <label>CSV File</label>
          </div>
          <div className="col-xs-6">
            {csv.name}
          </div>
          <div className="col-xs-3">
            <a onClick={onChangeFile}>change file</a>
          </div>
        </div>
        <div className="wiz-minimodal__body">
          <div className="wiz-upload-csv-settings">
            <div>Choose the CSV Column that matches each input</div>
            <div className="row wiz-minimodal__controlblock">
              <div className="col-xs-3">
                <label htmlFor="mac-column">Mac Address</label>
              </div>
              <div className="col-xs-6">
                <select id="mac-column"
                        onChange={onSelectMACColumn}
                        defaultValue={csv.columns.mac}>
                  {options}
                </select>
              </div>
            </div>
            <div className="row wiz-minimodal__controlblock">
              <div className="col-xs-3">
                <label htmlFor="ip-column">IP Address</label>
              </div>
              <div className="col-xs-6">
                <select id="ip-column"
                        onChange={onSelectIPColumn}
                        defaultValue={csv.columns.ip}>
                  {options}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    body = (
      <div>
        <div>
          Select a CSV file to populate the node addresses
        </div>
        <div className="wiz-minimodal__body">
          <input type="file" onChange={onUpload} />
          <div className="wiz-upload-csv-settings">
            <p>After uploading, you can select which columns correspond to the required data.</p>
          </div>
        </div>
      </div>
    );
  }

  const doneClasses = classNames('btn btn-primary', {
    disabled: !csv,
  });

  return (
    <div className="wiz-minimodal">
      <h3 className="wiz-form__header">Upload Addresses</h3>
      {body}
      <div className="wiz-minimodal__actions">
        <button type="button" className={doneClasses} onClick={onDone}>Done</button>
        <button className="btn btn-link" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
});

// Table of input fields for manual entry of node information
const NodeTable = ({count, theseNodes, allNodes, label, updateNodes}) => {
  const nodeElems = [];
  for (let i = 0; i < count; i++) {
    const node = theseNodes.get(i) || {mac: '', ip: ''};
    const macOnInput = (mac) => {
      const newNode = Object.assign({}, node, {mac});
      updateNodes(theseNodes.set(i, newNode), count);
    };
    const ipOnInput = (ip) => {
      const newNode = Object.assign({}, node, {ip});
      updateNodes(theseNodes.set(i, newNode), count);
    };
    const startprops = i > 0 ? {} : {autoFocus: true};

    const duplicateMACs = allNodes.filter(n => n.mac && n.mac === node.mac);
    const duplicateIPs = allNodes.filter(n => n.ip && n.ip === node.ip);

    nodeElems.push(
      <div className="row wiz-minitable__row" key={i}>
        <div className="col-xs-3">
          <span className="wiz-minitable__label">{label} {i + 1}:</span>
        </div>
        <div className="col-xs-4">
          <Input
              id={macFieldID(label, i)}
              className="wiz-ip-field"
              forceDirty={duplicateMACs.size > 1}
              invalid={!!validate.MAC(node.mac) || duplicateMACs.size > 1}
              value={node.mac}
              placeholder="MAC address"
              onValue={macOnInput}
              {...startprops}>
            {duplicateMACs.size > 1 ?
             'This MAC address is already in use by another node' :
             'Nodes must have valid MAC addresses'}
          </Input>
        </div>
        <div className="col-xs-4">
          <Input
              id={ipFieldID(label, i)}
              className="wiz-ip-field"
              forceDirty={duplicateIPs.size > 1}
              invalid={!!validate.IP(node.ip) || duplicateIPs.size > 1}
              value={node.ip}
              placeholder="IP address"
              onValue={ipOnInput} >
            {duplicateIPs.size > 1 ?
             'This IP address is already in use by another node' :
             'Nodes must have valid IP addresses'}
          </Input>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row wiz-minitable__header">
        <div className="col-xs-3">Profile Name</div>
        <div className="col-xs-4">MAC Address</div>
        <div className="col-xs-4">IP Address</div>
      </div>
      {nodeElems}
    </div>
  );
};

const NodeForm = connect(
  ({flags}) => {
    return {
      bulkUploadFlags: flags.BULK_UPLOAD || Set(),
    };
  },
  (dispatch) => {
    return {
      setBulkUploadMode: (file) => {
        dispatch({
          type: flagActionTypes.ADD,
          payload: {
            subject: 'BULK_UPLOAD',
            value: file,
          },
        });
      },
      unsetBulkUploadMode: (file) => {
        dispatch({
          type: flagActionTypes.DELETE,
          payload: {
            subject: 'BULK_UPLOAD',
            value: file,
          },
        });
      },
    };
  }
)((props) => {
  const {bulkUploadFlags, setBulkUploadMode, unsetBulkUploadMode, file} = props;
  if (bulkUploadFlags.has(file)) {
    return (
      <BulkUpload file={file}
                  close={() => unsetBulkUploadMode(file)}
                  {...props} />
    );
  }

  return (
    <div>
      <div className="form-group">
        <a onClick={() => setBulkUploadMode(file)}>
          <span className="fa fa-upload"></span> Bulk Upload Addresses</a>
      </div>
      <NodeTable {...props} />
    </div>
  );
});

const CONTROLLERS_FILE = {
  name: 'CONTROLLERS_FILE',
};

export const Controllers = connect(
  ({clusterConfig}) => {
    return {
      theseNodes: clusterConfig.masters,
      allNodes: clusterConfig.masters.concat(clusterConfig.workers),
      count: parseInt(clusterConfig.mastersCount, 10),
    };
  },
  (dispatch) => {
    return {
      updateNodes: (nodes, count) => {
        dispatch({
          type: configActionTypes.SET_MASTERS_LIST,
          payload: {nodes, count},
        });
      },
    };
  }
)(({count, theseNodes, allNodes, updateNodes, pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">Define Controllers</h3>
      <div className="form-group">
        Enter the MAC addresses of the nodes you'd like to use as controllers,
        and the IP addresses you'd like them to use.
      </div>
      <div className="form-group">
        <NodeForm count={count}
                  theseNodes={theseNodes}
                  allNodes={allNodes}
                  label="Controller"
                  file={CONTROLLERS_FILE}
                  updateNodes={updateNodes} />
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Controllers.isValid = ({clusterConfig}) => {
  const masters = clusterConfig.masters;
  const mastersCount = clusterConfig.mastersCount;
  const subnet = clusterConfig.subnet;

  const mastersOkSet = masters.filter((m) => {
    return m && !validate.MAC(m.mac) && !validate.IP(m.ip);
  });

  if (mastersOkSet.size < parseInt(mastersCount, 10)) {
    return false;
  }

  // In order to prevent weird lockouts and invalidation at a distance,
  // the deduplicate validation for controllers and workers isn't
  // symmetric. In particular, the Controllers form is valid if it
  // contains duplicates of Worker but not if the masters group has
  // duplicates within itself.
  const ipCounts = countBy(masters, n => n.ip);
  const macCounts = countBy(masters, n => n.mac);
  for (let i = 0; i < masters.size; i++) {
    const masterI = masters.get(i);
    if (ipCounts.get(masterI.ip) > 1) {
      return false;
    }
    if (macCounts.get(masterI.mac) > 1) {
      return false;
    }
  }

  return !validate.subnetMask(subnet);
};

const WORKERS_FILE = {
  name: 'WORKERS_FILE',
};

export const Workers = connect(
  ({clusterConfig}) => {
    return {
      theseNodes: clusterConfig.workers,
      allNodes: clusterConfig.workers.concat(clusterConfig.masters),
      count: parseInt(clusterConfig.workersCount, 10),
    };
  },
  (dispatch) => {
    return {
      updateNodes: (nodes, count) => {
        dispatch({
          type: configActionTypes.SET_WORKERS_LIST,
          payload: {nodes, count},
        });
      },
    };
  }
)(({count, theseNodes, allNodes, updateNodes, pagerInfo}) => {
  return (
    <div>
      <h3 className="wiz-form__header">Define Workers</h3>
      <div className="form-group">
        Enter the MAC addresses of the nodes you'd like to use as
        workers, and the IP addresses you'd like them to use.
      </div>
      <div className="form-group">
        <NodeForm count={count}
                  theseNodes={theseNodes}
                  allNodes={allNodes}
                  label="Worker"
                  file={WORKERS_FILE}
                  updateNodes={updateNodes} />
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Workers.isValid = ({clusterConfig}) => {
  const workers = clusterConfig.workers.toJS();
  const masters = clusterConfig.masters.toJS();
  const workersCount = clusterConfig.workersCount;
  const workersOk = workers.filter((m) => {
    return m && !validate.MAC(m.mac) && !validate.IP(m.ip);
  });

  let workersExpected = parseInt(workersCount, 10);
  if (isNaN(workersExpected)) {
    workersExpected = 3;
  }

  if (workersOk.length < workersExpected) {
    return false;
  }

  // The worker form is invalid if workers have the same mac or ip
  // addresses as other workers, or if they have the same mac or ip
  // addresses as controller nodes.
  const allNodes = workers.concat(masters);
  const ipCounts = countBy(allNodes, n => n.ip);
  const macCounts = countBy(allNodes, n => n.mac);
  for (let i = 0; i < workers.length; i++) {
    if (ipCounts.get(workers[i].ip) > 1) {
      return false;
    }
    if (macCounts.get(workers[i].mac) > 1) {
      return false;
    }
  }

  return true;
};
