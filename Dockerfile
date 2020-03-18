FROM docker-registry.camlab.kat.ac.za/cambase_bionic
WORKDIR /usr/src/app
COPY . .
RUN yarn install
EXPOSE 8000
CMD ["gulp", "webserver"]
