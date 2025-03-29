#!/bin/bash

# Exit on any error
set -e

# Function to print status messages
print_status() {
    echo "➜ $1"
}

# Check if running as root
if [ "$(id -u)" != "0" ]; then
    print_status "This script requires root privileges. Running with sudo..."
    sudo bash "$0" "$@"
    exit $?
fi

# Get the absolute path of the current directory
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy files to the installation directory
print_status "Installing reverse proxy system..."
bash "${CURRENT_DIR}/setup.sh"