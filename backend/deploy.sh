#!/bin/bash
# Deployment Script for You Can FI Backend

echo "🚀 You Can FI - Backend Deployment Script"
echo "=========================================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Run: python3 -m venv venv"
    exit 1
fi

# Prompt for Supabase password if not set
if [ -z "$SUPABASE_PASSWORD" ]; then
    echo "📝 Please enter your Supabase database password:"
    read -s SUPABASE_PASSWORD
    echo ""
fi

# Set the database URL
export DATABASE_URL="postgresql+psycopg://postgres:${SUPABASE_PASSWORD}@db.cwsoawrcxogoxrgmtowx.supabase.co:5432/postgres"

echo "✅ Activating virtual environment..."
source venv/bin/activate

echo "✅ Running Alembic migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations completed successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Verify tables in Supabase: https://supabase.com/dashboard/project/cwsoawrcxogoxrgmtowx/editor"
    echo "2. Deploy to Railway: https://railway.app/new"
    echo "3. Set environment variable in Railway:"
    echo "   DATABASE_URL=postgresql+psycopg://postgres:${SUPABASE_PASSWORD}@db.cwsoawrcxogoxrgmtowx.supabase.co:5432/postgres"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Check the error message above and verify:"
    echo "1. Your password is correct"
    echo "2. You have internet connection"
    echo "3. Supabase project is active"
    echo ""
fi

