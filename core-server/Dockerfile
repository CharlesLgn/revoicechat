# Stage 1: Build
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /build

COPY pom.xml .
COPY */pom.xml* ./

RUN --mount=type=cache,target=/root/.m2 \
    find /root/.m2 -name "*.part" -delete && \
    find /root/.m2 -name "*.lastUpdated" -delete

COPY . .
RUN --mount=type=cache,target=/root/.m2 \
    find /root/.m2 -name "*.part" -delete && \
    find /root/.m2 -name "*.lastUpdated" -delete && \
    for i in 1 2 3 4 5; do \
      ./mvnw install -DskipTests -T1 \
        -Dquarkus.config.locations=server.docker.properties \
        -Dmaven.wagon.httpconnectionManager.ttlSeconds=60 \
        -Dmaven.wagon.http.retryHandler.count=5 \
        -Dmaven.wagon.http.pool=false && break || \
      echo "Attempt $i failed, retrying in 10s..." && sleep 10; \
    done

# Stage 2: Runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

COPY --from=builder /build/app/target/quarkus-app/ /app/
COPY --from=builder /build/server.docker.properties /app/server.docker.properties
COPY --from=builder /build/jwt /app/jwt

EXPOSE 8080

CMD ["java", "-Dquarkus.config.locations=server.docker.properties", "-jar", "quarkus-run.jar"]