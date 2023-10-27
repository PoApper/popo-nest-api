FROM node:18.18-alpine

# popo version
ARG POPO_VERSION
ENV POPO_VERSION ${POPO_VERSION}

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start:prod"]