# Gunakan image node resmi
FROM node:lts

# Set working directory
WORKDIR /src

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh source code ke dalam container
COPY . .

# Build aplikasi (jika menggunakan create-react-app atau Vite)
RUN npm run build

# Install serve untuk menjalankan build statis
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Jalankan aplikasi menggunakan serve
CMD ["serve", "-s", "build", "-l", "3000"]