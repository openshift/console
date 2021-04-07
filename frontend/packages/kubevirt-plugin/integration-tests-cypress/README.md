###Available env variables

- `KUBEVIRT_PROJECT_NAME` - kubevirt namespace. Defaults to `openshift-cnv`, use `kubevirt-hyperconverged` for upstream.
- `OS_IMAGES_NS` - namespace of os images. Defaults to `kubevirt-os-images`, use `openshift-virtualization-os-images` for downstream.
- `TEMPLATE_NAME` - name of template to run `add-source` tests against - defaults to `Red Hat Enterprise Linux 6.0+ VM`
- `TEMPLATE_BASE_IMAGE` - base image name for `TEMPLATE_NAME` - defaults to `rhel6`
- `STORAGE_CLASS` - specify if you want to use other sc than the default one
- `UPLOAD_IMG` - specify path to image to be uploaded, defaults to `/tmp/cirros.img`
- `DOWNSTREAM` - specify if tests are running against downstream, or upstream. Defaults to false

See how to setup env variables in Cypress https://docs.cypress.io/guides/guides/environment-variables.html#Setting


## Tests subjects
- You should organize tests by pages and by components as you should test components individually if possible. *.includes files are ignored by cypress. You can nest describe functions of includes files inside a main spec file of the same component/page. The folder structure for tests might look like. 

├ component
├── test-a.includes.ts
├── test-b.includes.ts
├── component.spec.ts
├ page
├── test-a.includes.ts
├── test-b.includes.ts
├── page.spec.ts