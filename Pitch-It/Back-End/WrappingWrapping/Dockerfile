FROM openjdk:21-oracle
COPY app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx512m", "-jar", "/app.jar"]