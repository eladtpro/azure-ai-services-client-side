FROM node:20-alpine

# ENV PATH intruction ensures that the executables created during the npm build or the yarn build processes can be found.
ENV PATH /app/node_modules/.bin:$PATH 

# Set the working directory in the container to /app
WORKDIR /app
COPY . .
RUN npm ci --omit=dev
RUN npm run build --if-present

# WORKDIR /app
RUN ls -la
ENV NODE_ENV production 
EXPOSE 80 
USER nextjs 

CMD HOSTNAME="0.0.0.0" node server.js
