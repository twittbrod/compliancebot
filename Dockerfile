FROM node:6.6

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/

#use run npm install to install npm dependencies from previously copied package.json
RUN npm install

# Bundle app source
COPY . /usr/src/app


EXPOSE 8080

CMD [ "node", "mybot.js" ]