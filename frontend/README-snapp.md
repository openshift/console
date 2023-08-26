git switch release-4.13

git pull

VERSION=v1.0

sudo docker build --progress=plain -t registry.teh-1.snappcloud.io/snappcloud/console:master-${VERSION} -f Dockerfile.snapp .


sudo docker login registry.teh-1.snappcloud.io -u admin


sudo docker push registry.teh-1.snappcloud.io/snappcloud/console:master-${VERSION}
