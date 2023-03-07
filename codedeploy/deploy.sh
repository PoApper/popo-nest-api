#!/usr/bin/env bash

WORKDIR=/home/ec2-user/popo-nest-api
cd $WORKDIR

ECR_REGISTRY=151345152001.dkr.ecr.ap-northeast-2.amazonaws.com
ECR_REPOSITORY=popo-nest-api

echo "> Do AWS Codedeploy!"

docker --version
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY
docker pull $ECR_REGISTRY/$ECR_REPOSITORY:latest
docker image tag $ECR_REGISTRY/$ECR_REPOSITORY:latest $ECR_REPOSITORY:latest

docker-compose version
docker-compose -f docker-compose.prod.yaml up -d

docker image prune -f
