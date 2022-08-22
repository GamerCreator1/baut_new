FROM node:alpine
WORKDIR /baut_new
COPY package.json .
RUN yarn install
COPY . .
RUN yarn build 
RUN yarn prisma:generate
CMD [ "yarn", "start" ]
