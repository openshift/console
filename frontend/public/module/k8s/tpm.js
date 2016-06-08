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

angular.module('k8s')
.service('tpm', function () {
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
});
