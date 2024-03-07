# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 3000 for the application
EXPOSE 80

# Define the command to run the application
CMD [ "node", "./server/index.js" ]
# ENTRYPOINT [ "node", "./server/index.js" ]