# Gunakan node versi terbaru yang stabil (LTS) dengan varian alpine yang ringan
FROM node:20-alpine

# Tentukan direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json terlebih dahulu
# Ini dilakukan agar 'npm install' hanya dijalankan jika ada perubahan pada dependencies (cache optimization)
COPY package*.json ./

# Install dependencies
# Jika menggunakan bcrypt, pastikan build tools tersedia karena bcrypt butuh kompilasi C++
RUN apk add --no-cache python3 make g++ && \
    npm install --production && \
    apk del python3 make g++

# Salin seluruh kode sumber aplikasi
COPY . .

# Expose port sesuai dengan yang kamu gunakan di kode (30000)
EXPOSE 30000

# Jalankan aplikasi
CMD [ "node", "app.js" ]