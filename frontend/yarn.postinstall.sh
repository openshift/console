#!/bin/bash
set -e

cd ../kubevirt/node_modules 
for i in * ; do 
  if [ ! -d ../../frontend/node_modules/$i ] ; then
    cp -rv $i ../../frontend/node_modules/ 
  else
    echo Skipping $i 
  fi
done

cp -rv @patternfly/react-console ../../frontend/node_modules/@patternfly/
cp -rv @patternfly/react-charts ../../frontend/node_modules/@patternfly/
cp -rv @babel/runtime ../../frontend/node_modules/@babel/
