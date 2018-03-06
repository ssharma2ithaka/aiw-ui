#!/usr/bin/env bash

set -ex

SRC_DIR=$1 #  root folder of the workspace, /opt/git/workspace
BUILD_DIR=$2 # /mnt/deb-builds/${PACKAGE_NAME}-${VERSION}
PACKAGE_NAME=$3 # appName
VERSION=$4 # autogenerated timestamp
echo "Using package $PACKAGE_NAME and version ${VERSION}"

cd $SRC_DIR

# Grab a newer node.js
wget https://nodejs.org/dist/v8.3.0/node-v8.3.0-linux-x64.tar.xz
xz -dc node-v8.3.0-linux-x64.tar.xz | tar xf - -C /usr/local/

export PATH=/usr/local/node-v8.3.0-linux-x64/bin:$PATH

# Get Yarn and use it for NPM dependencies
npm install --global yarn

# Install global build packages
yarn global add webpack webpack-dev-server karma karma-cli protractor typescript rimraf phantomjs-prebuilt

# Install dependencies
yarn install

# Build the project! (uses Webpack)
# - sleep acts as a failsafe for broken dependencies stalling builds
sleep 600 & SPID=${!}; (yarn run build:prod; kill ${SPID}; exit 1) & CPID=${!}; fg 1; kill ${CPID}

# Collect our built files
rsync -a ${SRC_DIR}/dist/* ${BUILD_DIR}/

# Package our built app
tar -cvzf package.tgz ${SRC_DIR}/dist/