# syntax=docker/dockerfile:1
FROM node:16-slim
ENV NODE_ENV=production
WORKDIR /app
COPY index.js .
COPY token .
CMD [ "node", "index.js"]
EXPOSE 8082