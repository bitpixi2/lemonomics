# Lemonomics Kiro Hooks

This directory contains automated hooks for the Lemonomics game that showcase advanced Kiro developer experience capabilities.

## 🍋 Recipe ModMail Processor Hook

### Overview
Automatically processes recipe submissions from r/Lemonomics ModMail every hour, providing:
- **Smart Content Moderation**: AI-powered filtering for appropriateness and relevance
- **Automated Flair Awards**: "Recipe Contributor" flair for approved submissions
- **Personalized Responses**: Custom messages for approval/rejection
- **Conversation Management**: Automatic archiving of processed ModMail

### Files
- `recipe-modmail-processor.md` - Detailed hook configuration and instructions
- `process-recipes.sh` - Executable bash script for automated processing
- `README.md` - This documentation file

### Quick Start

1. **Ensure the game is running**:
   ```bash
   cd apps/karma-lemonade-stand
   npm run dev
   ```

2. **Test the hook manually**:
   ```bash
   ./.kiro/hooks/process-recipes.sh
   ```

3. **Set up automated scheduling** (in Kiro):
   - Open Kiro Hook UI from command palette
   - Import `recipe-modmail-processor.md`
   - Set to run every hour
   - Enable monitoring and logging

### API Endpoints

The hook interacts with these server endpoints:

#### Health Check
```bash
GET /api/health
```
Returns server status and feature availability.

#### Process Recipes
```bash
POST /api/process-recipes
```
Main processing endpoint that:
- Fetches new ModMail conversations
- Filters for recipe submissions
- Applies content moderation
- Awards flairs and sends responses
- Archives processed conversations

#### Manual Test
```bash
POST /api/test-modmail
```
Development endpoint for manual testing.

### Content Moderation Logic

#### Auto-Approval ✅
- Contains lemon/recipe keywords
- Family-friendly language
- Minimum 10 characters
- Recipe structure indicators

#### Auto-Rejection ❌
- Inappropriate/offensive language
- Spam or promotional content
- Too short (< 10 characters)
- Not recipe-related (for longer posts)

### User Experience Flow

1. **Player rates recipe 5 stars** in game
2. **"Share Your Recipe" button** appears
3. **ModMail opens** with pre-filled template
4. **Player submits** their recipe
5. **Hook processes** within 1 hour
6. **User receives** personalized response
7. **Flair awarded** (if approved)
8. **Conversation archived** automatically

### Monitoring & Logging

Each run logs:
- Execution timestamp
- Conversations processed
- Approval/rejection counts
- Processing errors
- Performance metrics

### Development Testing

Test the system locally:

```bash
# Check server health
curl http://localhost:8080/api/health

# Manual processing test
curl -X POST http://localhost:8080/api/test-modmail

# Full hook simulation
./.kiro/hooks/process-recipes.sh
```

### Integration Benefits

This hook demonstrates:
- **Community Engagement**: Seamless recipe sharing
- **Automation Excellence**: Zero manual moderation needed
- **User Experience**: Instant feedback and recognition
- **Scalability**: Handles growing community submissions
- **Developer Productivity**: Kiro handles the complexity

### Judging Criteria Achievement

**✅ Community Play**:
- Content creation through recipe sharing
- Shared experiences across all players
- Asynchronous community building
- Persistent engagement beyond gameplay

**✅ Kiro Developer Experience**:
- Advanced automation workflows
- Smart content processing
- Community management tools
- Seamless integration patterns

This showcases how Kiro can transform a simple game feature into a sophisticated community platform! 🍋✨🏆
