# Recipe ModMail Processor Hook

## Trigger

- **Type**: Scheduled
- **Frequency**: Every hour
- **Description**: Automatically processes recipe submissions from ModMail in r/Lemonomics

## Goal

Monitor r/Lemonomics ModMail for new recipe submissions and automatically:

1. **Content Review**: Check submissions for appropriateness and relevance
2. **Flair Awards**: Grant "Recipe Contributor" flair to approved submitters
3. **User Communication**: Send personalized approval/rejection messages
4. **Conversation Management**: Archive processed ModMail conversations

## Instructions

### Step 1: Check Development Server

First, ensure the Lemonomics app is running:

```bash
cd apps/karma-lemonade-stand
# Check if server is running on port 8080
curl -f http://localhost:8080/api/health || echo "Server not running - start with 'npm run dev'"
```

### Step 2: Process ModMail

Execute the ModMail processing:

```bash
cd apps/karma-lemonade-stand
response=$(curl -s -X POST http://localhost:8080/api/process-recipes)
echo "ModMail Processing Result: $response"
```

### Step 3: Parse and Log Results

Extract key metrics from the response:

- `processed`: Number of recipe submissions processed
- `approved`: Number of submissions approved and flaired
- `rejected`: Number of submissions rejected
- `conversationIds`: List of processed conversation IDs

### Step 4: Error Handling

If the API call fails:

1. **Log the error**: Record timestamp and error details
2. **Check server status**: Verify the development server is running
3. **Retry logic**: Wait 5 minutes and retry once
4. **Alert if needed**: If retry fails, log for manual review

## Expected Processing Logic

### Auto-Approval Criteria ✅

- Contains lemon/recipe-related keywords
- Has appropriate language (family-friendly)
- Includes recipe structure (ingredients, instructions)
- Minimum 10 characters of content

### Auto-Rejection Criteria ❌

- Contains inappropriate/offensive language
- Appears to be spam or promotional content
- Too short (less than 10 characters)
- Not recipe-related (for longer submissions)

### User Responses

**Approved Submissions**:

- Award "Recipe Contributor" flair
- Send congratulatory message with community welcome
- Archive conversation

**Rejected Submissions**:

- Send helpful feedback with improvement tips
- Encourage resubmission with guidelines
- Archive conversation

## Success Metrics

- **Response Time**: All submissions processed within 1 hour
- **Accuracy**: 95%+ appropriate approval/rejection decisions
- **User Experience**: Clear, helpful communication for all outcomes
- **Automation**: Zero manual moderation required for standard cases

## Monitoring & Alerts

Log the following for each run:

- Timestamp of execution
- Number of conversations processed
- Approval/rejection breakdown
- Any API errors or failures
- Processing time duration

## Development Testing

For manual testing during development:

```bash
curl -X POST http://localhost:8080/api/test-modmail
```

## Context & Integration

This hook powers the **Recipe Break** feature in Lemonomics:

- Players rate in-game recipes on a 1-5 star scale
- 5-star ratings trigger "Share Your Recipe" button
- Button opens pre-filled ModMail template
- This hook processes submissions automatically
- Creates seamless community engagement loop

The automation showcases advanced Kiro capabilities while building genuine community interaction around the game's lemon theme! 🍋✨
