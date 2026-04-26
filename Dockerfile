FROM nginx:alpine

COPY souveraenitaet-reifegradmodell.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/templates/default.conf.template
