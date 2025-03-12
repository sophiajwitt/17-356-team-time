# Use an official Node runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port your backend listens on (adjust as needed)
EXPOSE 5001

# Start the application
CMD ["node", "index.js"]

