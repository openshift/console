bridge
======
control center for clusters and fleets


## Standard Build
 1. Build the backend `./build`  
 1. Build the frontend `./build-web`  

Backend binaries are generated in `/bin`.  
Frontend build assets are generated in `/frontend/public/dist`.  

### Dependencies
- go
- nodejs (for frontend builds)


## Hacking

Add new frontend dependencies:
 - from `frontend` run `gulp deps`

Add new backend dependencies:
 - run `godep save -r ./...`

If changes are made to the `schema/v1.json` file you must:
 1. Rebuild the bindings by running: `schema/generator`
 1. Rewrite go dependencies: `godep save -r ./...`

Update existing backend dependencies:
 1. `go get -u foo/bar` as usual
 1. `godep update foo/bar`

Run the dev server (auto-loads new code changes):  
`./devweb`

### Dependencies
- nodejs gulp
