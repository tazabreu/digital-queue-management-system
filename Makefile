.PHONY: build test clean deploy

# Build the application
build:
	npm run build

# Run tests
test:
	npm test

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules

# Install dependencies
install:
	npm install

# Deploy to cloud functions (placeholder)
deploy:
	@echo "Deploying to cloud functions..."
	# Add deployment commands here for AWS Lambda or Google Cloud Functions

# Development mode
dev:
	npm run dev

# Default target
all: clean install build test 