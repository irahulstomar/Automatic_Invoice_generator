FROM node:20

WORKDIR /app

COPY Frontend/package*.json ./

RUN npm install

COPY Frontend .

EXPOSE 3000
EXPOSE 5173

CMD ["npm", "run", "start"]
