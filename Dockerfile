FROM node:9.4-alpine

WORKDIR /app

COPY . /app

RUN npm install --quiet

EXPOSE 3000
ENV NODE_ENV development