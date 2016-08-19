export const validate = {
  nonEmpty: function (s) {
    if (s != null && ('' + s).trim().length > 0) {
      return;
    }

    return 'Value must not be empty.';
  },

  certificate: (s) => {
    const trimmed = (s || '').trim();
    if (trimmed.length >= 55 && trimmed.match(/^-----BEGIN CERTIFICATE-----[^]*-----END CERTIFICATE-----$/)) {
      return;
    }

    return 'Value must be valid certificate.';
  },

  caKey: (s) => {
    const trimmed = (s || '').trim();
    if (trimmed.length >= 63 && trimmed.match(/^-----BEGIN RSA PRIVATE KEY-----[^]*-----END RSA PRIVATE KEY-----$/)) {
      return;
    }

    return 'Value must be valid private key.';
  },

  email: (s) => {
    // from: https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (EMAIL_RE.test(s)) {
      return;
    }

    return 'A valid email address is required.';
  },

  MAC: (s) => {
    // We want to accept everything that golang net.ParseMAC will
    // see https://golang.org/src/net/mac.go?s=1054:1106#L28
    const trimmed = (s || '').trim();
    const error = 'Value must be valid MAC address.';

    if (trimmed.match(/^([a-fA-F0-9]{2}\:)+([a-fA-F0-9]{2})$/)) {
      if (trimmed.length === '01:23:45:67:89:ab'.length ||
        trimmed.length === '01:23:45:67:89:ab:cd:ef'.length ||
        trimmed.length === '01:23:45:67:89:ab:cd:ef:00:00:01:23:45:67:89:ab:cd:ef:00:00'.length) {
        return;
      }

      return error;
    }

    if (trimmed.match(/^([a-fA-F0-9]{2}\-)+([a-fA-F0-9]{2})$/)) {
      if (trimmed.length === '01-23-45-67-89-ab'.length ||
        trimmed.length === '01-23-45-67-89-ab-cd-ef'.length ||
        trimmed.length === '01-23-45-67-89-ab-cd-ef-00-00-01-23-45-67-89-ab-cd-ef-00-00'.length) {
        return;
      }

      return error;
    }

    if (trimmed.match(/^([a-fA-F0-9]{4}\.)+([a-fA-F0-9]{4})$/)) {
      if (trimmed.length === '0123.4567.89ab'.length ||
        trimmed.length === '0123.4567.89ab.cdef'.length ||
        trimmed.length === '0123.4567.89ab.cdef.0000.0123.4567.89ab.cdef.0000'.length) {
        return error;
      }
    }

    return error;
  },

  IP: (s) => {
    // four octets of decimal numbers in the valid range. This allows
    // screwy IPs like 0.0.0.0 and 127.0.0.1
    const matched = (s || '').match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (matched && matched.slice(1).every(oct => parseInt(oct, 10) < 256)) {
      return;
    }

    return 'Value must be valid IP address.';
  },

  subnetMask: (s) => {
    const [ip, bitsStr] = (s || '').split('/', 2);

    if (bitsStr && bitsStr.match(/^[0-9]+$/)) {
      const bits = parseInt(bitsStr, 10);
      if (!validate.IP(ip) && bits >= 0 && bits <= 32) {
        return;
      }
    }

    return 'Value must be valid subnet mask.';
  },

  domainName: (s) => {
    if ((s || '').split('.').every(l => l.match(/^[a-zA-Z0-9-]{1,63}$/))) {
      return;
    }

    return 'Value must be valid domain name.';
  },

  host: (s) => {
    // either valid IP address or domain name
    if (!validate.IP(s) || !validate.domainName(s)) {
      return;
    }

    return 'Value must be valid domain name or IP address.';
  },

  port: (s) => {
    if ((s || '').match(/^[0-9]+$/)) {
      return;
    }

    return 'Value must be valid number.';
  },

  hostPort: (s) => {
    const [host, port] = (s || '').split(':', 2);
    if (!host || !port) {
      return 'Value must be in <host>:<port> format.';
    }

    if (validate.IP(host) && validate.domainName(host)) {
      return 'Host value must be valid domain name or IP address.';
    }

    if (validate.port(port)) {
      return 'Port value must be valid number.';
    }

    return;
  },

  SSHKey: (s) => {
    // *very* hand-wavy - two or three fields, the second looks vaguely Base64
    if ((s || '').trim().match(/^[\w-]+ [A-Za-z0-9+\/]+={0,2}(?:$| .)/)) {
      return;
    }

    return 'Value must be valid SSH key.';
  },

  k8sName: (s) => {
    const trimmed = (s || '').trim();
    const error = 'Value must be valid Kubernetes name. Please refer to http://kubernetes.io/docs/user-guide/identifiers/.';

    if (trimmed.length === 0) {
      return error;
    }

    if (trimmed.length > 253) {
      return error;
    }

    // lower case alphanumeric characters, -, and ., with alpha beginning and end
    if (!/^([a-z0-9][a-z0-9.-]*)?[a-z0-9]$/.test(trimmed)) {
      return error;
    }

    for (let t of trimmed.split('.')) {
      // each segment no more than 63 characters
      if (t.length > 63) {
        return error;
      }
    }

    return;
  },

  schema: (schema) => {
    return (value) => {
      for (let k of Object.keys(schema)) {
        let validity = schema[k](value[k]);
        if (validity) {
          return validity;
        }
      }

      return;
    };
  },
};
