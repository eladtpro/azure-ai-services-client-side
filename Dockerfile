# Use an official Node.js runtime as the base image
FROM node:20

# ENV PATH intruction ensures that the executables created during the npm build or the yarn build processes can be found.
ENV PATH /app/node_modules/.bin:$PATH 
ENV NODE_ENV production 

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# COPY package*.json ./
COPY . .
RUN ls -la

# npm ci – production to install the application dependencies, and only install the one that is non-dev (production)
RUN npm ci --omit=dev
# If you are building your code for production
# RUN npm ci --only=production
RUN npm run build 

# COPY . .

ENV NODE_ENV production 

EXPOSE 80 

USER node 

# Define the command to run the application
CMD [ "node", "./server/index.js" ]
# ENTRYPOINT [ "node", "./server/index.js" ]
