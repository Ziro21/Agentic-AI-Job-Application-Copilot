#!/bin/bash
# ============================================================================
# Setup script for Agentic AI Job Application Copilot
# ============================================================================
# This script sets up the development environment for the project.
# Run this once when you first clone the repository.
# ============================================================================

set -e  # Exit on any error

echo "============================================================================"
echo "Agentic AI Job Application Copilot - Setup Script"
echo "============================================================================"
echo ""

# Check Python version
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
echo "✅ Found Python $PYTHON_VERSION"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
if [ -d "venv" ]; then
    echo "Virtual environment already exists. Skipping creation."
else
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip --quiet
echo "✅ pip upgraded"
echo ""

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Copy .env.example to .env if it doesn't exist
if [ -f ".env" ]; then
    echo ".env file already exists. Skipping copy."
else
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and fill in your actual database credentials"
fi
echo ""

# Copy settings.example.yaml to settings.yaml if it doesn't exist
if [ -f "config/settings.yaml" ]; then
    echo "config/settings.yaml already exists. Skipping copy."
else
    echo "Creating config/settings.yaml from config/settings.example.yaml..."
    cp config/settings.example.yaml config/settings.yaml
    echo "✅ Default settings copied. Edit config/settings.yaml to customize."
fi
echo ""

# Validate configuration
echo "Validating configuration..."
python3 config/loader.py
echo ""

echo "============================================================================"
echo "✅ Setup complete!"
echo "============================================================================"
echo ""
echo "Next steps:"
echo "1. Edit .env with your database credentials"
echo "2. Edit config/settings.yaml with your preferences"
echo "3. Set up the database: alembic upgrade head"
echo "4. Run the scheduler: python3 scheduler/run_daily.py"
echo "5. Launch the UI: streamlit run ui/streamlit_app.py"
echo ""
