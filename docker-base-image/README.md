# Docker Base Image 

[Docker Hub](https://hub.docker.com/repository/docker/dhairyashah98/python-base/general)

Adding python dependencies directly to the wallet will lead to inconsistencies in the docker image built and hence result in different PCRS values for each build.

We need to add dependencies separately, and use this as the base image to be run inside the enclave.

## Building the base image

Since this image is going to be run inside Amazon Linux 2 AMI (HVM) hence platform needs to be `linux/amd64`.

```
docker buildx build --platform=linux/amd64 --push -t dhairyashah98/python-base:3.12-deps-amd64 -f base.Dockerfile .
```

## Verifying the image

The image hosted [here](https://hub.docker.com/repository/docker/dhairyashah98/python-base/general) is the same as the one that will be used inside the enclave and is generated using the `base.Dockerfile` file.

Users should verify the contents of the image when building the enclave image themselves to verify the PCRS values.

### Viewing the image contents

```
brew install dive
dive dhairyashah98/python-base:3.12-deps
```

All commands used to build the image can be seen in layer details for each layer
