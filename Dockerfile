# Multi-stage build for CogniCare Web Dashboard
# Stage 1: Build the React app
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_BACKEND_ORIGIN=https://cognicare-mobile-h4ct.onrender.com
ARG VITE_PUBLIC_SITE_ORIGIN=https://cognicare.app
ENV VITE_BACKEND_ORIGIN=$VITE_BACKEND_ORIGIN
ENV VITE_PUBLIC_SITE_ORIGIN=$VITE_PUBLIC_SITE_ORIGIN

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
