# Build the React frontend.
FROM node:24-bookworm-slim AS frontend-build

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Build Spring Boot with the frontend included.
FROM maven:3.9-eclipse-temurin-21 AS backend-build

WORKDIR /build/backend

COPY backend/pom.xml ./
COPY backend/src ./src

COPY --from=frontend-build /build/frontend/dist/ ./src/main/resources/static/

RUN mvn -B -DskipTests package


# Run only the packaged application.
FROM eclipse-temurin:21-jre-jammy AS runtime

WORKDIR /app

RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app app

COPY --from=backend-build --chown=app:app \
    /build/backend/target/muniverse-0.0.1-SNAPSHOT.jar \
    /app/app.jar

USER app

ENV SERVER_PORT=8080

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]