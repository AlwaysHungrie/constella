# A Go base image is enough to build nitriding reproducibly.
# We use a specific instead of the latest image to ensure reproducibility.
FROM golang:1.22 as builder

WORKDIR /    

# Clone the repository and build the stand-alone nitriding executable.
RUN git clone https://github.com/brave/nitriding-daemon.git
ARG TARGETARCH
RUN ARCH=${TARGETARCH} make -C nitriding-daemon/ nitriding

# Use the intermediate builder image to add our files.  This is necessary to
# avoid intermediate layers that contain inconsistent file permissions.
COPY start.sh /bin/
COPY src /bin/src

RUN chown root:root /bin/src/server.py /bin/start.sh
RUN chmod 0755      /bin/src/server.py /bin/start.sh

FROM --platform=linux/amd64  dhairyashah98/python-base:3.12-deps

# Copy all our files to the final image.
COPY --from=builder /nitriding-daemon/nitriding /bin/start.sh /bin/
COPY --from=builder /bin/src /bin/src

CMD ["start.sh"]
