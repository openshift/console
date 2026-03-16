package devfile

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

const validDevfileNoParent = `
schemaVersion: 2.2.0
metadata:
  name: test-app
  attributes:
    alpha.dockerimage-port: 8080
components:
  - name: image-build
    image:
      imageName: test-image:latest
      dockerfile:
        uri: Dockerfile
        buildContext: .
  - name: kubernetes-deploy
    kubernetes:
      inlined: |
        kind: Deployment
        apiVersion: apps/v1
        metadata:
          name: my-deploy
        spec:
          replicas: 1
          selector:
            matchLabels:
              app: test-app
          template:
            metadata:
              labels:
                app: test-app
            spec:
              containers:
                - name: my-container
                  image: test-image:latest
commands:
  - id: build-image
    apply:
      component: image-build
  - id: deployk8s
    apply:
      component: kubernetes-deploy
  - id: deploy
    composite:
      commands:
        - build-image
        - deployk8s
      group:
        kind: deploy
        isDefault: true
`

const devfileWithBadRegistry = `
schemaVersion: 2.2.0
metadata:
  name: test
parent:
  id: nonexistent-stack
  registryUrl: 'https://does-not-exist.invalid'
components:
  - name: image-build
    image:
      imageName: test:latest
      dockerfile:
        uri: Dockerfile
        buildContext: .
  - name: kubernetes-deploy
    kubernetes:
      inlined: |
        kind: Deployment
        apiVersion: apps/v1
        metadata:
          name: test-deploy
        spec:
          replicas: 1
          selector:
            matchLabels:
              app: test
          template:
            metadata:
              labels:
                app: test
            spec:
              containers:
                - name: test
                  image: test:latest
commands:
  - id: build-image
    apply:
      component: image-build
  - id: deployk8s
    apply:
      component: kubernetes-deploy
  - id: deploy
    composite:
      commands:
        - build-image
        - deployk8s
      group:
        kind: deploy
        isDefault: true
`

func TestParseDevfileWithFallback(t *testing.T) {
	httpTimeout := 10

	t.Run("devfile without parent parses on first attempt", func(t *testing.T) {
		devfileObj, err := parseDevfileWithFallback([]byte(validDevfileNoParent), &httpTimeout)
		assert.NoError(t, err)

		components, err := GetDeployComponents(devfileObj)
		assert.NoError(t, err)
		assert.Contains(t, components, "image-build")
		assert.Contains(t, components, "kubernetes-deploy")
	})

	t.Run("devfile with unreachable parent falls back to unflattened parse", func(t *testing.T) {
		devfileObj, err := parseDevfileWithFallback([]byte(devfileWithBadRegistry), &httpTimeout)
		assert.NoError(t, err, "fallback to unflattened parse should succeed")

		components, err := GetDeployComponents(devfileObj)
		assert.NoError(t, err)
		assert.Contains(t, components, "image-build")
		assert.Contains(t, components, "kubernetes-deploy")
	})

	t.Run("completely invalid devfile fails both attempts", func(t *testing.T) {
		_, err := parseDevfileWithFallback([]byte("not valid yaml: ["), &httpTimeout)
		assert.Error(t, err)
	})
}
