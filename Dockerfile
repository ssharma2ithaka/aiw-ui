# Builds a Docker to deliver dist/
FROM node:10

# Add environment variables
ENV PORT=80
ENV SAGOKU=true

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
# Temp until cached @angular files catch-up
RUN npm link @angular/cli
RUN npm install

# Bundle app source
COPY . .

# Ensure pug is compiled on first build, and avoid "missing command" issue in @angular cache
RUN npm run postinstall
RUN npm link @angular/cli

# Build app
RUN npm run build:ssr

EXPOSE 80

CMD [ "npm", "run", "serve:ssr" ]
