#!/bin/bash

# Exit on any error
set -e

echo "🔍 Checking test coverage for Clarity contracts..."
echo "================================================"

# Initialize counters
total_contracts=0
untested_contracts=0

# Function to convert contract path to expected test path
get_test_path() {
    local contract_path=$1
    # Remove 'contracts/' prefix and replace with 'tests/'
    # Replace .clar with .test.ts
    echo "${contract_path/contracts\//tests\/}" | sed 's/\.clar$/.test.ts/'
}

# Find all Clarity contracts
while IFS= read -r contract; do
    ((total_contracts++))
    test_file=$(get_test_path "$contract")
    
    if [ ! -f "$test_file" ]; then
        echo "❌ Missing test file for: $contract"
        echo "   Expected test at: $test_file"
        ((untested_contracts++))
    fi
done < <(find contracts -name "*.clar")

# Print summary
echo ""
echo "📊 Summary"
echo "=========="
echo "Total contracts found: $total_contracts"
echo "Contracts with tests: $(($total_contracts - $untested_contracts))"
echo "Contracts without tests: $untested_contracts"
echo ""

if [ $untested_contracts -eq 0 ]; then
    echo "✅ All contracts have corresponding test files"
    exit 0
else
    echo "❌ Action needed: $untested_contracts contract(s) are missing tests"
    exit 1
fi
