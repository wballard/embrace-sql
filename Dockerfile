FROM node:12

WORKDIR /usr/embracesql
COPY . .
RUN yarn

ENTRYPOINT ["yarn", "cli"]