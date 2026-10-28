
FROM node:22-bookworm-slim

RUN npm install -g opencode-ai

WORKDIR /app

EXPOSE 4096

CMD ["opencode", "serve", "--hostname", "0.0.0.0", "--port", "4096", "--cors", "http://localhost:3030"]
