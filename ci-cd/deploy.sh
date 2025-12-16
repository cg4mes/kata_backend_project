#!/bin/bash
set -e

# Script para hacer deploy y crear tags de versión
# Similar a bbog-pse-loan-payment-adapter

tagRelease()
{
  git push origin HEAD
  versionTag=v$(cat package.json | grep version | head -1 | sed 's/[^0-9.]//g')
  git tag $versionTag
  git push origin $versionTag
  echo "version $versionTag tagged successful"
}

pushRelease()
{
    npm version patch -m "release"
    tagRelease
}

pushRelease
