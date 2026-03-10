# Use Alpine for the smallest possible footprint
FROM alpine:3.18

# Install all required compilers and runtimes
# python3: Python 3.10+
# openjdk17-jre/jdk: Java 17
# g++: C & C++
# mono: C# (Note: Mono is the lightest way to run C# on Alpine)
RUN apk add --no-cache \
    python3 \
    openjdk17 \
    g++ \
    gcc \
    libc-dev \
    mono --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing

# Create a non-root user for security
RUN adduser -D student
USER student
WORKDIR /app

# The command is provided dynamically by the Node.js service
CMD ["sh"]