# Use the official Rust image as the base image
FROM rust:latest
ENV DATABASE_URL={{environment.DATABASE_URL}}

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install the sqlx-cli
RUN cargo install sqlx-cli

# Copy the project files into the container
COPY . .

# Run the sqlx migration
RUN sqlx migrate run

RUN cargo build

# Build and run the Rust app
CMD ["cargo", "run"]

