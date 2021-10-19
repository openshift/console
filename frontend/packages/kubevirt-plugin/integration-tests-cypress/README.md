### Available env variables

- `STORAGE_CLASS` - specify if you want to use other sc than the default one
- `UPLOAD_IMG` - specify path to image to be uploaded, defaults to `/tmp/cirros.img`
- `DOWNSTREAM` - specify if tests are running against downstream, or upstream. Defaults to false
- `DUALSTACK` - specify if tests can be run in a dual stack network cluster. Use for IPv6-related tests

Local testing may need DOWNSTREAM=true

Local set env usage: CYPRESS\_{variable_name}={value} && yarn run test-cypress-kubevirt

example:

```bash
CYPRESS_DOWNSTREAM=true && yarn run test-cypress_kubevirt
```

More info: <https://docs.cypress.io/guides/guides/environment-variables.html#Setting>

## Tests subjects

- You should organize tests by pages and by components as you should test components individually if possible. \*.includes files are ignored by cypress. You can nest describe functions of includes files inside a main spec file of the same component/page. The folder structure for tests might look like.

├ component
├── test-a.includes.ts
├── test-b.includes.ts
├── component.spec.ts
├ page
├── test-a.includes.ts
├── test-b.includes.ts
├── page.spec.ts