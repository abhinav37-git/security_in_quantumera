FROM golang:1.24-alpine

# Install Python3 for the subprocess scanner execution
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy dependency files
COPY go.mod go.sum ./
RUN go mod download

# Copy application source
COPY . .

# Build the API binary
RUN go build -o main apps/api/main.go

EXPOSE 8080

CMD ["./main"]
