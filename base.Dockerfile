FROM python:3.12-slim-bullseye

# Install dependencies with specific versions for consistency
RUN pip install Flask==3.1.0 fastapi==0.115.8 uvicorn==0.34.0 requests==2.32.3

# Clean up cache to reduce image size and maintain consistency
RUN pip cache purge && \
    rm -rf /root/.cache/pip/*

# docker buildx create --name amd64builder --use
# docker buildx build --platform=linux/amd64 --push -t dhairyashah98/python-base:3.12-deps-amd64 -f base.Dockerfile .