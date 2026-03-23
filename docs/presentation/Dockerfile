FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
EXPOSE 8080
# Cloud Run requires nginx to listen on $PORT (8080)
CMD ["nginx", "-g", "daemon off;"]
