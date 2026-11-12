FROM node:24.22.2-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY vendor ./vendor

RUN npm ci

COPY . .

RUN npm run build

# popo version
ARG POPO_VERSION
ENV POPO_VERSION ${POPO_VERSION}

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
