FROM node:20 AS prod-build

# ENV PATH intruction ensures that the executables created during the npm build or the yarn build processes can be found.
ENV PATH /app/node_modules/.bin:$PATH 

# Set the working directory in the container to /app
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
RUN npm run build 


FROM node:20 AS prod-run

COPY --chown=node:node --from=prod-build /app/public /app/
COPY --chown=node:node --from=prod-build /app/server /app/
COPY --chown=node:node --from=prod-build /app/hostingstart.js /app/

WORKDIR /app
RUN ls -la
ENV NODE_ENV production 
EXPOSE 80 
USER node 

CMD [ "node", "./server/index.js" ]
# ENTRYPOINT [ "node", "./server/index.js" ]
