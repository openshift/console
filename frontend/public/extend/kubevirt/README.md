# KubeVirt extension

This directory contains [KubeVirt](https://kubevirt.io/) extension of Console UI.

## Components

KubeVirt components generally follow Console UI dependency requirements, including
[PatternFly 3](https://github.com/patternfly/patternfly) and the corresponding
[PatternFly-React](https://github.com/patternfly/patternfly-react) implementation.

KubeVirt components themselves are maintained in a separate repository and used via
[kubevirt-web-ui-components](https://www.npmjs.com/package/kubevirt-web-ui-components)
npm package.

## Integration

All KubeVirt related integration code lives in `frontend/public/extend/kubevirt`.
This code is imported and used in various modules of the frontend application through
minimum necessary changes.

### Styling

The main `style.scss` stylesheet is modified to import KubeVirt related styles which
generally follow the [BEM](http://getbem.com/) methodology along with the `kubevirt`
prefix to namespace all KubeVirt component styling.

## Dependencies

KubeVirt related dependencies are simply added to the frontend `package.json` file.
