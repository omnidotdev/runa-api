FROM ubuntu:24.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    unzip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Create non-root agent user
RUN groupadd -g 1000 agent \
    && useradd -m -u 1000 -g agent -s /bin/bash agent

# Copy bun binary for agent user
RUN cp -r /root/.bun /home/agent/.bun \
    && chown -R agent:agent /home/agent/.bun
ENV PATH="/home/agent/.bun/bin:$PATH"

# Configure git for agent commits
RUN su - agent -c 'git config --global user.name "Runa Agent"' \
    && su - agent -c 'git config --global user.email "agent@runa.dev"'

# Create workspace directory
RUN mkdir -p /workspace && chown agent:agent /workspace
WORKDIR /workspace

# Switch to non-root user
USER agent

# Keep container running (sandbox lifecycle managed by API)
CMD ["sleep", "infinity"]
