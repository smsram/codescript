# Use Ubuntu 22.04 LTS as the base
FROM ubuntu:22.04

# Prevent interactive prompts during package installation (e.g., timezone setups)
ENV DEBIAN_FRONTEND=noninteractive

# Update apt and install all required compilers
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    openjdk-17-jdk \
    g++ \
    gcc \
    libc6-dev \
    mono-mcs \
    mono-runtime \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN useradd -m student
USER student
WORKDIR /app

# Default command
CMD ["sh"]
