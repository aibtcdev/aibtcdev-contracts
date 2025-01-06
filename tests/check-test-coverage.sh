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
echo "Finding Clarity contracts..."
while IFS= read -r contract; do
    contracts+=("$contract")
done < <(find contracts -name "*.clar")

echo "Found ${#contracts[@]} contract files"

# Check if any contracts were found
if [ ${#contracts[@]} -eq 0 ]; then
    echo "❌ No .clar files found in the contracts directory!"
    echo "   Please make sure you're running this script from the project root."
    exit 1
fi

# Process each contract
echo -e "\nChecking test coverage..."
for contract in "${contracts[@]}"; do
    # Skip test contracts directory
    if [[ $contract == contracts/test/* ]]; then
        continue
    fi
    
    ((total_contracts++))
    test_file=$(get_test_path "$contract")
    
    # Check for both .test.ts and .ts test files
    test_file_alt="${test_file/.test.ts/.ts}"
    
    if [ -f "$test_file" ] || [ -f "$test_file_alt" ]; then
        printf "✅ %-50s -> %s\n" "$contract" "$(basename "${test_file}")"
    else
        printf "❌ %-50s -> Missing test file\n" "$contract"
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
