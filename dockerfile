FROM node:22-alpine3.19

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

EXPOSE 3000
