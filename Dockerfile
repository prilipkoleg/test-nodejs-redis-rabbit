FROM node:9.4-alpine

WORKDIR /app

COPY package.json /app

#RUN npm install --global nodemon
RUN npm install --quiet

EXPOSE 3000
ENV NODE_ENV development