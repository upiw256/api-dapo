FROM node:20-alpine

# Install build tools untuk bcrypt (hanya jika diperlukan)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependensi (production mode agar lebih ringan)
RUN npm install --only=production

COPY . .

EXPOSE 30000

CMD ["node", "app.js"]