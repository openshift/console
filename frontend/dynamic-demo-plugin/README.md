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

## Docker image

Following commands should be executed in Console repository root.

1. Build the image:
   ```sh
   docker build -f Dockerfile.plugins.demo -t $USER/console-demo-plugin .
   ```
2. Run the image:
   ```sh
   docker run -it -p 9001:9001 $USER/console-demo-plugin
   ```
3. Push the image to Docker Hub or similar image registry:
   ```sh
   docker push $USER/console-demo-plugin
   ```

To test a locally built demo plugin image, simply update and re-apply `oc-manifest.yaml`.
