# OpenShift Console Demo Plugin

This project emulates a standalone repository hosting a sample
[dynamic plugin](/frontend/packages/console-dynamic-plugin-sdk/README.md) for OpenShift Console.

It is meant to serve as a reference for Console plugin developers and for testing dynamic plugin
capabilities via end-to-end tests.

## Local development

1. `yarn build` to build the plugin, generating output to `dist` directory
2. `yarn http-server` to start an HTTP server hosting the generated assets

```
Starting up http-server, serving ./dist
Available on:
  http://127.0.0.1:9001
  http://192.168.1.190:9001
  http://10.40.192.80:9001
Hit CTRL-C to stop the server
```

The server runs on port 9001 with caching disabled and CORS enabled. Additional
[server options](https://github.com/http-party/http-server#available-options) can be passed to
the script, for example:

```sh
yarn http-server -a 127.0.0.1
```

See the plugin development section in
[Console Dynamic Plugins README](/frontend/packages/console-dynamic-plugin-sdk/README.md) for details
on how to run Bridge using local plugins.

## Deployment on cluster

Console dynamic plugins are supposed to be deployed via [OLM operators](https://github.com/operator-framework).
In case of demo plugin, we just apply a minimal OpenShift manifest which adds the necessary resources.

```sh
oc apply -f oc-manifest.yaml
```

Note that the `Service` exposing the HTTP server is annotated to have a signed
[service serving certificate](https://docs.openshift.com/container-platform/4.6/security/certificates/service-serving-certificate.html)
generated and mounted into the image. This allows us to run the server with HTTP/TLS enabled, using
a trusted CA certificate.

## Enabling the plugin

Once deployed on the cluster, demo plugin must be enabled before it can be loaded by Console.

To enable the plugin manually, edit [Console operator](https://github.com/openshift/console-operator)
config and make sure the plugin's name is listed in the `spec.plugins` sequence (add one if missing):

```sh
oc edit console.operator.openshift.io cluster
```

```yaml
# ...
spec:
  plugins:
    - console-demo-plugin
# ...
```

## Proxy service

In case the plugin needs to communicate with some in-cluster service, it can
declare a service proxy in its `ConsolePlugin` resource using the
`spec.proxy.services` array field. A service `name`, `namespace` and `port`
needs to be specified.

Console backend exposes following endpoint in order to proxy the communication
between plugin and the service:
`/api/proxy/namespace/<service-namespace>/service/<service-name>:<port-number>/<request-path>?<optional-query-parameters>`

An example proxy request path from plugin to `helm-charts` service,
in `helm` namespace to list ten helm releases:
`/api/proxy/namespace/helm/service/helm-charts:8443/releases?limit=10`

Proxied request will use [service CA bundle](https://docs.openshift.com/container-platform/4.8/security/certificate_types_descriptions/service-ca-certificates.html) by default. The service must use HTTPS.
If the service uses a custom service CA, the `caCertificate` field
must contain the certificate bundle. In case the service proxy request
needs to contain logged-in user's OpenShift access token, the `authorize`
field needs to be set to `true`. The user's OpenShift access token will be
then passed in the HTTP `Authorization` request header, for example:

`Authorization: Bearer sha256~kV46hPnEYhCWFnB85r5NrprAxggzgb6GOeLbgcKNsH0`

```yaml
# ...
spec:
  proxy:
    services:
    - name: helm-charts
      namespace: helm
      port: 8443
      caCertificate: '-----BEGIN CERTIFICATE-----\nMIID....'
      authorize: true
# ...
```

### Local development

In case of local developement of the dynamic plugin, just set up your
HTTP server locally and pass its endpoint address in form of a service proxy 
entry to the console server in form of JSON, using the `--plugin-proxy` flag.


Example:
```
 ./bin/bridge --plugin-proxy='{"services":[{"consoleAPIPath":"/api/proxy/namespace/serviceNamespace/service/serviceName:9991/","endpoint":"http://localhost:8080"}]}'
```

The service proxy entry besides service `endpoint` contain also `consoleAPIPath`, so the console server knows which path is should expose and proxy to service endpoint.
Note that the service `endpoint` needs to contain scheme and `consoleAPIPath` needs to contain trailing slash in order for request to be proxied correctly.

## Docker image

Following commands should be executed in Console repository root.

1. Build the image:
   ```sh
   docker build -f Dockerfile.plugins.demo -t quay.io/$USER/console-demo-plugin .
   ```
2. Run the image:
   ```sh
   docker run -it -p 9001:9001 quay.io/$USER/console-demo-plugin
   ```
3. Push the image to image registry:
   ```sh
   docker push quay.io/$USER/console-demo-plugin
   ```

Update and apply `oc-manifest.yaml` to use a custom plugin image.

## i18n

The demo plugin demonstrates how you can translate messages in a dynamic plugin
with [react-i18next](https://react.i18next.com/). The i18n namespace must match
the name of the `ConsolePlugin` resource with the `plugin__` prefix to avoid
naming conflicts. For example, the demo plugin uses the
`plugin__console-demo-plugin` namespace. You can use the `useTranslation` hook
with this namespace as follows:

```tsx
conster Header: React.FC = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  return <h1>{t('Hello, World!')}</h1>;
};
```

For labels in `console-extensions.json`, you can use the format
`%plugin__console-demo-plugin~My Label%`. Console will replace the value with
the message for the current language from the `plugin__console-demo-plugin`
namespace. For example:

```json
  {
    "type": "console.navigation/section",
    "properties": {
      "id": "admin-demo-section",
      "perspective": "admin",
      "name": "%plugin__console-demo-plugin~Demo Plugin%"
    }
  }
```

Note that you will need to include a comment in a TypeScript file like the
following for [i18next-parser](https://github.com/i18next/i18next-parser) to
add the message from `console-extensions.json` to your message catalog.

```ts
// t('plugin__console-demo-plugin~Demo Plugin')
```

Running `yarn i18n` updates the JSON files in the `locales` folder of the
dynamic plugin when adding or changing messages.
