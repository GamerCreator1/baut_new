FROM node:alpine
WORKDIR /baut_new
COPY package.json .
RUN yarn install
COPY . .
RUN yarn build 
CMD [ "yarn", "start" ]
