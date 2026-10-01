FROM docker.m.daocloud.io/library/golang:1.24-alpine AS build

WORKDIR /src
ENV GOPROXY=https://goproxy.cn,direct
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/api ./cmd/api

FROM docker.m.daocloud.io/library/alpine:3.20
RUN adduser -D -u 65532 app
USER app
COPY --from=build /out/api /api
ENV HTTP_ADDR=:8080
EXPOSE 8080
ENTRYPOINT ["/api"]
