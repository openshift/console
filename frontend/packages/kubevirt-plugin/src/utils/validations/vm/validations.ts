const HEXCH_REGEX = '[0-9A-Fa-f]';
const MAC_REGEX_COLON_DELIMITER = new RegExp(
  `^((${HEXCH_REGEX}{2}[:]){19}${HEXCH_REGEX}{2})$|` + // 01:23:45:67:89:ab:cd:ef:00:00:01:23:45:67:89:ab:cd:ef:00:00
  `^((${HEXCH_REGEX}{2}[:]){7}${HEXCH_REGEX}{2})$|` + // 01:23:45:67:89:ab:cd:ef
    `^((${HEXCH_REGEX}{2}[:]){5}${HEXCH_REGEX}{2})$`, // 01:23:45:67:89:ab
);

const MAC_REGEX_DASH_DELIMITER = new RegExp(
  `^((${HEXCH_REGEX}{2}[-]){19}${HEXCH_REGEX}{2})$|` + // 01-23-45-67-89-ab-cd-ef-00-00-01-23-45-67-89-ab-cd-ef-00-00
  `^((${HEXCH_REGEX}{2}[-]){7}${HEXCH_REGEX}{2})$|` + // 01-23-45-67-89-ab-cd-ef
    `^((${HEXCH_REGEX}{2}[-]){5}${HEXCH_REGEX}{2})$`, // 01-23-45-67-89-ab
);

const MAC_REGEX_PERIOD_DELIMITER = new RegExp(
  `^((${HEXCH_REGEX}{4}.){9}${HEXCH_REGEX}{4})$|` + // 0123.4567.89ab.cdef.0000.0123.4567.89ab.cdef.0000
  `^((${HEXCH_REGEX}{4}.){3}${HEXCH_REGEX}{4})$|` + // 0123.4567.89ab.cdef
    `^((${HEXCH_REGEX}{4}.){2}${HEXCH_REGEX}{4})$`, // 0123.4567.89ab
);

const COLON_DELIMITER = ':';
const DASH_DELIMITER = '-';
const PERIOD_DELIMITER = '.';

// Validates that the provided MAC address meets one of following formats supported by the golang ParseMAC function:
// IEEE 802 MAC-48, EUI-48, EUI-64, or a 20-octet IP over InfiniBand link-layer address
// https://golang.org/pkg/net/#ParseMAC
export const isValidMAC = (mac: string): boolean => {
  if (mac.length < 14) {
    return false;
  }

  let regex;
  if (mac[2] === COLON_DELIMITER) {
    regex = MAC_REGEX_COLON_DELIMITER;
  } else if (mac[2] === DASH_DELIMITER) {
    regex = MAC_REGEX_DASH_DELIMITER;
  } else if (mac[4] === PERIOD_DELIMITER) {
    regex = MAC_REGEX_PERIOD_DELIMITER;
  }

  return regex ? regex.test(mac) : false;
};
