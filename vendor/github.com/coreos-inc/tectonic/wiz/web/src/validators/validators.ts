import { AbstractControl, Control, Validator, NG_VALIDATORS } from '@angular/common';
import { Directive, provide } from '@angular/core';

export interface ValidatorFn { (c: AbstractControl): { [key: string]: any }; }

export interface ValidatorResult { [key: string]: any }

// from: https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
const ADDRESS_RE =  /^[\w-.]+:\d+$/;
const URL_RE =  /^(http|https):\/\/[\w-@:.]*(?:\/.*)?/;

// TODO: get rid of these two and get back to URL_RE as soon as we
// officially introduce software load balancers
// https://github.com/coreos-inc/tectonic/issues/297
const CONSOLE_URL_RE =  /^https:\/\/[\w-@:.]+:32000$/;
const IDENTITY_URL_RE =  /^https:\/\/[\w-@:.]+:32001$/;

// postgres://<username>:<password>@<host:port>/<database>[?extra]
export const POSTGRESQL_URL_RE =  /^postgres:\/\/(.+):(.+)@(.+)\/(.+?)(\?.+)?$/i;

// Kubernetes identifier validation. See:
// https://github.com/kubernetes/kubernetes/blob/bd9d9802430f374b4015ef28a1f131d41f9a9ffc/docs/design/identifiers.md
const DNS_LABEL_PTN = '[a-z0-9][a-z0-9\-]';
const K8S_NAME_RE = new RegExp('^(?:' + DNS_LABEL_PTN + '*)(?:\\.(?:' + DNS_LABEL_PTN + '*))*' + '$');

export class WizValidators {

  static getByName(name: string): ValidatorFn {
    switch(name) {
      case 'K8S_NAME':
        return WizValidators.k8sName;
      case 'ADDRESS':
        return WizValidators.address;
      case 'CONSOLE_URL_RE':
        return WizValidators.re(CONSOLE_URL_RE, 'A valid Console URL in format https://host:32000 is required.');
      case 'IDENTITY_URL_RE':
        return WizValidators.re(IDENTITY_URL_RE, 'A valid Identity URL in format https://host:32001 is required.');
      case 'URL':
        return WizValidators.url;
      case 'EMAIL':
        return WizValidators.email;
      case 'POSTGRESQL_URL':
        return WizValidators.psql;
      case 'JSON':
        return WizValidators.json;
      case 'CERTIFICATE':
        return WizValidators.certificate;
      case 'PRIVATE_KEY':
        return WizValidators.privateKey;
      case 'NONEMPTY':
        return WizValidators.nonempty;
    }
    return null;
  }

  static re(r: RegExp, m: string): ValidatorFn {
    return function re(c: AbstractControl): ValidatorResult {
      if (!r.test(c.value)) {
        return {
          re: m
        }
      }

      return null;
    };
  }

  static nonempty(c: AbstractControl): ValidatorResult {
    let val = c.value;
    if (!val || ('' + val).trim() === '') { // coerse to string as values can be of any type
      return {
        nonempty: 'Value must not be empty.',
      };
    }
    return null;
  }

  static email(c: AbstractControl): ValidatorResult {
    if (!EMAIL_RE.test(c.value)) {
      return {
        email: 'A valid email address is required.',
      }
    }
    return null;
  }

  static address(c: AbstractControl): ValidatorResult {
    if (!ADDRESS_RE.test(c.value)) {
      return {
        address: 'A valid address in host:port format is required.',
      }
    }
    return null;
  }

  static url(c: AbstractControl): ValidatorResult {
    if (!URL_RE.test(c.value)) {
      return {
        url: 'A valid URL is required.',
      }
    }
    return null;
  }

  static psql(c: AbstractControl): ValidatorResult {
    if (!POSTGRESQL_URL_RE.test(c.value)) {
      return {
        url: 'A valid PostgreSQL connection string is required.',
      }
    }
    return null;
  }

  static certificate(c: AbstractControl): ValidatorResult {
    if (!c.value) {
      return {
        certificate: 'A certificate in PEM format is required.',
      };
    }

    // TODO (sym3tri): arbitrary length check that some value and delimiters exist. is there a better way?
    if (c.value.length < 55) {
      return {
        certificate: 'The certificate you entered appears to be too short.',
      };
    }

    if (c.value.indexOf('-----BEGIN CERTIFICATE-----') === -1) {
      return {
        certificate: 'The certificate must begin with: "-----BEGIN CERTIFICATE-----".',
      };
    }

    if (c.value.indexOf('-----END CERTIFICATE-----') === -1) {
      return {
        certificate: 'The certificate must end with: "-----END CERTIFICATE-----".',
      };
    }

    return null;
  }

  static privateKey(c: AbstractControl): ValidatorResult {
    if (!c.value) {
      return {
        privateKey: 'A private key is required.',
      };
    }

    // TODO (sym3tri): arbitrary length check that some value and delimiters exist. is there a better way?
    if (c.value.length < 63) {
      return {
        privateKey: 'The private key you entered appears too short.',
      };
    }

    if (c.value.indexOf('-----BEGIN RSA PRIVATE KEY-----') === -1) {
      return {
        privateKey: 'The private key must begin with: "-----BEGIN RSA PRIVATE KEY-----".',
      };
    }

    if (c.value.indexOf('-----END RSA PRIVATE KEY-----') === -1) {
      return {
        privateKey: 'The private key must end with: "-----END RSA PRIVATE KEY-----".',
      };
    }

    return null;
  }

  static json(c: AbstractControl): ValidatorResult {
    try {
      JSON.parse(c.value);
    }
    catch (e) {
      return {
        json: 'Valid JSON is required.',
      };
    }
    return null;
  }

  static k8sName(c: AbstractControl): ValidatorResult {
    let name = c.value;

    if (!name) {
      return {
        k8sName: 'Field must not be empty.',
      };
    }

    if (name.length > 253) {
      return {
        k8sName: 'Field must be 253 characters or less.',
      };
    }

    if (!K8S_NAME_RE.test(name)) {
      return {
        k8sName: 'Field must consist of lowercase alphanumeric characters and dashes, separated by dots.',
      };
    }

    for (let s of name.split('.')) {
      if (s.length > 63) {
        return {
          k8sName: 'Each dot-separated segment must be less than 63 characters.',
        };
      }
    }

    return null;
  }

}

@Directive({
  selector: '[wizValidateNonempty]',
  // Magic angular2 stuff to register a new validator directive.
  providers: [
    provide(NG_VALIDATORS, { useExisting: NonemptyValidator, multi: true }),
  ]
})
export class NonemptyValidator implements Validator {
  validate(c: Control): {[key: string]: any} {
    return WizValidators.nonempty(c);
  }
}

@Directive({
  selector: '[wizValidateK8sName]',
  providers: [
    provide(NG_VALIDATORS, { useExisting: K8sNameValidator, multi: true }),
  ]
})
export class K8sNameValidator implements Validator {
  validate(c: Control): {[key: string]: any} {
    return WizValidators.k8sName(c);
  }
}

@Directive({
  selector: '[wizValidateJSON]',
  providers: [
    provide(NG_VALIDATORS, {useExisting: JSONValidator, multi: true}),
  ]
})
export class JSONValidator implements Validator {
  validate(c: Control): {[key: string]: any} {
    return WizValidators.json(c);
  }
}
