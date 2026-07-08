# syntax=docker/dockerfile:1
#
#   docker build -t sgs/frontend-angular:local .

# ---------------------------------------------------------------------------
# Étape 1/2 : build - Node + Angular CLI, jamais présents dans l'image finale
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Couche dépendances : ne se réinvalide que si package*.json change, pas à chaque modif de code.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# ---------------------------------------------------------------------------
# Étape 2/2 : exécution - Nginx seul sert les fichiers statiques compilés, aucun outil Node,
# aucun code source, aucun node_modules dans l'image finale.
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# L'image nginx officielle définit déjà un utilisateur "nginx" non privilégié - il faut juste
# lui donner la permission d'écrire son fichier pid et son cache, puisqu'on n'exécute jamais
# le process en root (cf. USER ci-dessous).
RUN mkdir -p /var/cache/nginx /var/run \
    && chown -R nginx:nginx /var/cache/nginx /var/run

# angular.json "outputPath": "dist/sgs-frontend" + builder @angular/build:application ->
# les fichiers statiques réels sont dans le sous-dossier "browser".
COPY --from=build --chown=nginx:nginx /app/dist/sgs-frontend/browser /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/ >/dev/null || exit 1
