'use strict';

// http://www.trustedcomputinggroup.org/wp-content/uploads/PC-ClientSpecific_Platform_Profile_for_TPM_2p0_Systems_v21_Public-Review.pdf#765
const PCR_ENUM = {
  0:  '0 - Firmware',
  1:  '1 - Hardware Configuration',
  2:  '2 - UEFI Driver',
  3:  '3 - UEFI Configuration',
  4:  '4 - UEFI Boot Attempts',
  5:  '5 - Boot Manager/GPT',
  6:  '6 - Manufacturer Specific',
  7:  '7 - Secure Boot Policy',
  8:  '8 - Grub (Kernel Parameters)',
  9:  '9 - Grub (Binary)',
};

const ALL = 'ALL';

const LAYERS = {
  [ALL]: [0, 15],
  'Early Boot': [0, 7],
  'Operating System': [8, 9],
  'Container Engine': [10, 15],
};


angular.module('k8s')
.service('tpm', function (CONST) {
  const INVALID_POLICY =  CONST.INVALID_POLICY;

  this.pcrToHuman = (number) => {
    return PCR_ENUM[number];
  };
  this.pcrRawToHex = (pcr) => {
    return pcr && pcr.map((x) => {
      let h = x.toString('16');
      if (h.length === 1) {
        h = '0' + h;
      }
      return h;
    }).join('');
  };
  this.policyToLayer = (policy) => {
    return _.uniq(Object.keys(policy.policy).map(pcr => {
      let layer;
      pcr = parseInt(pcr, 10);
      _.find(LAYERS, (range, name) => {
        if (name === ALL) {
          return;
        }
        if (pcr >= range[0] && pcr <= range[1]) {
          layer = name;
          return true;
        }
      });
      return layer;
    }));
  };

  this.auditNode = (node) => {
    const annotations = node.metadata.annotations && node.metadata.annotations['tpm.coreos.com/logstate'];
    if (!annotations) {
      return {};
    }
    const logstate = JSON.parse(annotations);

    const init = {};
    _.each(new Array(10), (v, k) => {
      init[k] = [];
    });

    const pcrToPolicy = logstate.reduce((acculator, log) => {
      const pcr = log.Pcr;
      acculator[pcr] = acculator[pcr] || [];
      let source = log.Source;
      if (source === '') {
        source = INVALID_POLICY;
      }
      acculator[pcr].push(source)
      return acculator;
    }, init);

    const policyList = {};
    _.each(pcrToPolicy, (policies, pcr) => {
      // CoreOS only uses PCRs 0-9 ...
      if (pcr > 9) {
        return;
      }

      let invalid = false;

      policies = _.uniq(policies).sort();
      if (policies.indexOf(INVALID_POLICY) >= 0) {
        policies = [INVALID_POLICY];
        invalid = true;
      }

      policyList[pcr] = {
        policies,
        invalid,
      };
    });

    return policyList;
  }

  this.LAYERS = LAYERS;
});
