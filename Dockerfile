# Use the official PostgreSQL base image
FROM postgres:latest

# Set permanent environment variable defaults (using the placeholder variables)
ENV POSTGRES_DB=${DB_NAME}
ENV POSTGRES_USER=${DB_USER}
ENV POSTGRES_PASSWORD=${DB_PASSWORD}

# Document that this image expects traffic on port 5432
EXPOSE 5432
EXPOSE ${DB_PORT}
