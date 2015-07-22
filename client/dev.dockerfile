FROM node:14

WORKDIR /usr/src/messagingApp/client

EXPOSE 3000

CMD ["npm", "start"]