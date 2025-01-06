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

# Debug: Print current directory
echo "Running from directory: $(pwd)"
echo "Looking for .clar files..."

# Find all Clarity contracts and store in array
contracts=()
while IFS= read -r contract; do
    contracts+=("$contract")
done < <(find contracts -name "*.clar")

# Check if any contracts were found
if [ ${#contracts[@]} -eq 0 ]; then
    echo "❌ No .clar files found in the contracts directory!"
    echo "   Please make sure you're running this script from the project root."
    exit 1
fi

# Process each contract
for contract in "${contracts[@]}"; do
    ((total_contracts++))
    test_file=$(get_test_path "$contract")
    
    if [ ! -f "$test_file" ]; then
        echo "❌ Missing test file for: $contract"
        echo "   Expected test at: $test_file"
        ((untested_contracts++))
    fi
done

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
