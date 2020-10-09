FROM node:10
WORKDIR /usr/src/app
VOLUME ["/usr/src/app"]
# COPY . .
RUN npm install -g gulp@4.0.2
RUN yarn install
# EXPOSE 8000
# CMD ["gulp", "webserver"]
