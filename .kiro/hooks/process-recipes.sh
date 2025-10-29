#!/bin/bash

# Recipe ModMail Processor Script
# Called by Kiro hook every hour

echo "🍋 Starting Recipe ModMail Processing - $(date)"

# Change to app directory
cd apps/karma-lemonade-stand

# Check if server is running
echo "🔍 Checking server health..."
health_response=$(curl -s -f http://localhost:8080/api/health)
if [ $? -ne 0 ]; then
    echo "❌ Server not responding - please start with 'npm run dev'"
    exit 1
fi

echo "✅ Server is healthy"
echo "Health: $health_response"

# Process ModMail
echo "📬 Processing ModMail conversations..."
process_response=$(curl -s -X POST http://localhost:8080/api/process-recipes)
curl_exit_code=$?

if [ $curl_exit_code -eq 0 ]; then
    echo "✅ ModMail processing completed successfully"
    echo "Result: $process_response"
    
    # Extract metrics (basic parsing)
    processed=$(echo "$process_response" | grep -o '"processed":[0-9]*' | cut -d':' -f2)
    approved=$(echo "$process_response" | grep -o '"approved":[0-9]*' | cut -d':' -f2)
    rejected=$(echo "$process_response" | grep -o '"rejected":[0-9]*' | cut -d':' -f2)
    
    echo "📊 Summary: Processed=$processed, Approved=$approved, Rejected=$rejected"
    
    if [ "$processed" -gt 0 ]; then
        echo "🎉 Successfully processed $processed recipe submissions!"
    else
        echo "📭 No new recipe submissions to process"
    fi
else
    echo "❌ ModMail processing failed (exit code: $curl_exit_code)"
    echo "Response: $process_response"
    
    # Retry once after 5 minutes
    echo "⏳ Waiting 5 minutes before retry..."
    sleep 300
    
    echo "🔄 Retrying ModMail processing..."
    retry_response=$(curl -s -X POST http://localhost:8080/api/process-recipes)
    retry_exit_code=$?
    
    if [ $retry_exit_code -eq 0 ]; then
        echo "✅ Retry successful!"
        echo "Retry result: $retry_response"
    else
        echo "❌ Retry failed - manual intervention may be required"
        echo "Retry response: $retry_response"
        exit 1
    fi
fi

echo "🏁 Recipe ModMail processing complete - $(date)"
