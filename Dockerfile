# Используем официальный образ Playwright с Node.js
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (через прокси)
RUN npm install

# Копируем все файлы проекта
COPY . .

# # Устанавливаем переменные окружения для прокси (глобально для контейнера)
# ENV HTTP_PROXY="http://u6292972345565-zone-custom-region-DE:pEuBRxYd@f.proxys5.net:6200"
# ENV HTTPS_PROXY="http://u6292972345565-zone-custom-region-DE:pEuBRxYd@f.proxys5.net:6200"
# ENV NO_PROXY="localhost,127.0.0.1"

# # Проверяем, что прокси работает (тест IPv4)
# RUN echo "Проверка прокси..." && \
#     apt-get update && \
#     apt-get install -y curl && \
#     curl -x http://u6292972345565-zone-custom-region-DE:pEuBRxYd@f.proxys5.net:6200 http://api.ipify.org?format=json

# Запускаем приложение
CMD ["node", "src/index.js"]