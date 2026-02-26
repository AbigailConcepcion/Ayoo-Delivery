# simple Node server build for Ayoo API
FROM node:18-alpine
WORKDIR /app

# only copy package manifests first to leverage Docker caching
COPY package.json yarn.lock* package-lock.json* ./

# install production deps only
RUN npm install --production || true

# copy application source
COPY . .

# build TypeScript
RUN npx tsc --build

EXPOSE 4000

CMD ["node","dist/index.js"]
