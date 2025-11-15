#!/bin/bash

echo "🔍 Verifying SDK Migration..."
echo ""

# Check if SDK exists
if [ -d "src/sdk" ]; then
  echo "✅ SDK directory exists"
else
  echo "❌ SDK directory missing"
  exit 1
fi

# Check if old files are deleted
echo ""
echo "Checking old files are deleted:"
[ ! -f "src/hooks/useSmartAuth.tsx" ] && echo "✅ useSmartAuth.tsx deleted" || echo "⚠️  useSmartAuth.tsx still exists"
[ ! -f "src/hooks/useAuthCallback.tsx" ] && echo "✅ useAuthCallback.tsx deleted" || echo "⚠️  useAuthCallback.tsx still exists"
[ ! -f "src/hooks/usePatientData.tsx" ] && echo "✅ usePatientData.tsx deleted" || echo "⚠️  usePatientData.tsx still exists"
[ ! -f "src/lib/api.ts" ] && echo "✅ api.ts deleted" || echo "⚠️  api.ts still exists"
[ ! -f "src/lib/auth.ts" ] && echo "✅ auth.ts deleted" || echo "⚠️  auth.ts still exists"

# Check if new files exist
echo ""
echo "Checking SDK components exist:"
[ -f "src/components/Login.tsx" ] && echo "✅ Login.tsx exists" || echo "❌ Login.tsx missing"
[ -f "src/components/Dashboard.tsx" ] && echo "✅ Dashboard.tsx exists" || echo "❌ Dashboard.tsx missing"
[ -f "src/hooks/useAuth.tsx" ] && echo "✅ useAuth.tsx exists" || echo "❌ useAuth.tsx missing"
[ -f "src/app/sdk-init.ts" ] && echo "✅ sdk-init.ts exists" || echo "❌ sdk-init.ts missing"

# Check SDK structure
echo ""
echo "Checking SDK structure:"
[ -d "src/sdk/core" ] && echo "✅ core/" || echo "❌ core/ missing"
[ -d "src/sdk/providers" ] && echo "✅ providers/" || echo "❌ providers/ missing"
[ -d "src/sdk/services" ] && echo "✅ services/" || echo "❌ services/ missing"
[ -d "src/sdk/hooks" ] && echo "✅ hooks/" || echo "❌ hooks/ missing"
[ -d "src/sdk/types" ] && echo "✅ types/" || echo "❌ types/ missing"

# Check backups
echo ""
echo "Checking backups:"
[ -d ".backup/old-code" ] && echo "✅ Backup directory exists" || echo "⚠️  No backup directory"
[ -f ".backup/old-code/Login.tsx" ] && echo "✅ Login.tsx backed up" || echo "⚠️  Login.tsx not backed up"
[ -f ".backup/old-code/Dashboard.tsx" ] && echo "✅ Dashboard.tsx backed up" || echo "⚠️  Dashboard.tsx not backed up"

echo ""
echo "✨ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Visit: http://localhost:3000"
echo "3. Test login and dashboard"
echo ""
