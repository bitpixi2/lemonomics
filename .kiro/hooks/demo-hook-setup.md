# Kiro Hook Setup Demo

## How to Set Up the Recipe ModMail Processor Hook

### Step 1: Open Kiro Hook UI
1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Search for "Open Kiro Hook UI"
3. Click to open the hook management interface

### Step 2: Create New Hook
1. Click "Create New Hook"
2. Choose "Scheduled Hook" type
3. Set name: "Recipe ModMail Processor"
4. Set frequency: "Every hour"

### Step 3: Configure Hook Actions
Copy and paste this configuration:

```yaml
name: Recipe ModMail Processor
trigger:
  type: scheduled
  frequency: hourly
  description: Process recipe submissions from ModMail

actions:
  - name: Check Server Health
    type: bash
    command: |
      cd apps/karma-lemonade-stand
      curl -f http://localhost:8080/api/health || exit 1
    
  - name: Process ModMail
    type: bash
    command: |
      cd apps/karma-lemonade-stand
      ./.kiro/hooks/process-recipes.sh
    
  - name: Log Results
    type: log
    message: "ModMail processing completed at {{timestamp}}"

error_handling:
  retry_count: 1
  retry_delay: 300  # 5 minutes
  alert_on_failure: true
```

### Step 4: Test the Hook
1. Click "Test Hook" to run manually
2. Check the output logs
3. Verify the server endpoints respond correctly

### Step 5: Enable Automation
1. Toggle "Enable Hook" to activate
2. Set logging level to "Info"
3. Enable email notifications (optional)

## Expected Output

When the hook runs successfully, you'll see:
```
🍋 Starting Recipe ModMail Processing - [timestamp]
✅ Server is healthy
📬 Processing ModMail conversations...
✅ ModMail processing completed successfully
📊 Summary: Processed=2, Approved=1, Rejected=1
🎉 Successfully processed 2 recipe submissions!
🏁 Recipe ModMail processing complete - [timestamp]
```

## Monitoring Dashboard

The hook will appear in your Kiro monitoring dashboard with:
- ✅ Last run status
- 📊 Processing metrics
- ⏰ Next scheduled run
- 📝 Recent logs
- 🚨 Any error alerts

## Integration Benefits

This demonstrates how Kiro transforms manual community management into:
- **Automated workflows** that run reliably
- **Smart processing** with built-in error handling
- **Community engagement** without moderator overhead
- **Scalable systems** that grow with your community

Perfect for showcasing advanced Kiro capabilities to judges! 🏆
