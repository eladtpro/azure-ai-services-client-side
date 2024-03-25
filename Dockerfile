FROM node:20-alpine

# ENV PATH intruction ensures that the executables created during the npm build or the yarn build processes can be found.
ENV PATH /app/node_modules/.bin:$PATH 

WORKDIR /app
COPY . .
RUN npm ci --omit=dev
RUN npm run build --if-present

RUN ls -la
EXPOSE 80 
USER nextjs 

CMD HOSTNAME="0.0.0.0" node ./server/index.js
