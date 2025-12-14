#!/bin/bash

###############################################################################
# Deploy Script for kata-backend
# This script handles deployment tagging and pushing to remote repository
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to tag a release
tagRelease() {
    print_info "Pushing changes to remote repository..."
    git push origin HEAD
    
    # Extract version from package.json
    versionTag=v$(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
    
    print_info "Creating tag: $versionTag"
    git tag $versionTag
    
    print_info "Pushing tag to remote..."
    git push origin $versionTag
    
    print_info "Version $versionTag tagged successfully ✓"
}

# Function to push a release
pushRelease() {
    print_info "Starting release process..."
    print_info "Current version: $(cat package.json | grep version | head -1)"
    
    # Increment patch version
    npm version patch -m "Release: %s"
    
    # Tag and push
    tagRelease
    
    print_info "Release process completed successfully ✓"
}

# Main execution
print_info "=== Kata Backend Deployment Script ==="
print_info "This will increment the version and create a new release tag"

# Check if git working directory is clean
if [[ -n $(git status -s) ]]; then
    print_warning "Working directory has uncommitted changes"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Execute release
pushRelease

print_info "=== Deployment Complete ==="
print_info "Next steps:"
print_info "  1. AWS CodePipeline will automatically detect the new tag"
print_info "  2. CodeBuild will build and push the Docker image"
print_info "  3. ECS will deploy to the target environment"
