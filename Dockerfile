FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl wget gnupg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

# Install Playwright chromium and its dependencies
RUN npx playwright install-deps chromium && \
    npx playwright install chromium

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5173 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
