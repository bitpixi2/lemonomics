# Karma Lemonade Stand - Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Quality
- [ ] All tests passing (`npm run test:run`)
- [ ] Code coverage above 70% (`npm run test:coverage`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] No linting errors
- [ ] All features implemented and tested

### ✅ Configuration
- [ ] `devvit.json` properly configured with payments
- [ ] Product SKUs and pricing finalized
- [ ] App permissions correctly set
- [ ] Author field set to `u/bitpixi`

### ✅ Assets
- [ ] All images optimized and in `public/assets/`
- [ ] Splash screen images present
- [ ] Icon files properly sized
- [ ] No placeholder content remaining

### ✅ Payment Integration
- [ ] **CRITICAL**: Replace placeholder payment system with real Devvit Payments API
- [ ] Test payment flow in Devvit sandbox
- [ ] Verify receipt validation works
- [ ] Confirm revenue routing to your account

## Deployment Steps

### 1. Final Testing
```bash
# Run complete test suite
npm run test:run

# Run coverage report
npm run test:coverage

# Type checking
npm run type-check

# Build verification
npm run build
```

### 2. Pre-Production Build
```bash
# Clean build
rm -rf dist/
npm run build

# Verify build output
ls -la dist/
```

### 3. Devvit Upload
```bash
# Upload to Reddit for review
npm run upload

# Check upload status
devvit status
```

### 4. Testing in Devvit Environment
```bash
# Start playtest environment
npm run dev

# Test in browser at provided URL
# Verify all functionality works in Devvit context
```

### 5. Production Launch
```bash
# Launch to production (after Reddit approval)
npm run launch
```

## Post-Deployment Monitoring

### Health Checks
Monitor these endpoints after deployment:
- `/api/health` - Basic system health
- `/api/health/detailed` - Comprehensive system status
- `/api/health/metrics` - Performance metrics

### Analytics Monitoring
Track these metrics:
- Daily active users (`/api/analytics/engagement`)
- Revenue metrics (`/api/analytics/monetization`)
- Error rates (`/api/health/metrics`)
- Game completion rates

### Key Performance Indicators (KPIs)
- **User Engagement**: Daily/Weekly active users
- **Retention**: 1-day, 7-day, 30-day retention rates
- **Monetization**: Conversion rate, ARPU (Average Revenue Per User)
- **Technical**: Error rate < 5%, Response time < 500ms
- **Game Balance**: Average profit per game, power-up usage rates

## Troubleshooting Common Issues

### Payment Issues
```bash
# Check payment configuration
cat devvit.json | grep -A 20 "payments"

# Verify payment endpoints
curl -X GET "https://your-app-url/api/powerup-status" \
  -H "x-user-id: test-user"
```

### Performance Issues
```bash
# Check system health
curl -X GET "https://your-app-url/api/health/detailed"

# Monitor response times
curl -w "@curl-format.txt" -X GET "https://your-app-url/api/health/metrics"
```

### Data Issues
```bash
# Run maintenance tasks
curl -X POST "https://your-app-url/api/maintenance/run/validate-data-integrity"

# Check maintenance status
curl -X GET "https://your-app-url/api/maintenance/stats"
```

## Rollback Procedure

If issues arise after deployment:

1. **Immediate Response**
   ```bash
   # Check system status
   devvit status
   
   # View recent logs
   devvit logs --tail 100
   ```

2. **Quick Fix Deployment**
   ```bash
   # Make critical fixes
   # Test locally
   npm run test:run
   
   # Deploy hotfix
   npm run upload
   ```

3. **Full Rollback** (if necessary)
   ```bash
   # Revert to previous version
   git revert HEAD
   npm run upload
   ```

## Scaling Considerations

### Redis Performance
- Monitor Redis memory usage
- Implement data archiving for old leaderboards
- Consider Redis clustering for high traffic

### API Rate Limiting
- Monitor API endpoint usage
- Implement additional rate limiting if needed
- Scale server resources based on traffic

### Database Maintenance
- Schedule regular cleanup tasks
- Monitor data growth patterns
- Implement automated backups

## Security Checklist

### Data Protection
- [ ] User data properly encrypted
- [ ] No sensitive data in logs
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints

### Payment Security
- [ ] Receipt verification implemented
- [ ] Anti-fraud measures in place
- [ ] Secure payment processing
- [ ] Audit trail for all transactions

### API Security
- [ ] Authentication required for sensitive endpoints
- [ ] CORS properly configured
- [ ] No exposed internal endpoints
- [ ] Error messages don't leak sensitive info

## Maintenance Schedule

### Daily
- Monitor system health endpoints
- Check error rates and performance metrics
- Review payment transaction logs

### Weekly
- Run data integrity validation
- Archive old leaderboard data
- Review user engagement metrics

### Monthly
- Analyze revenue and conversion metrics
- Update game balance based on analytics
- Plan feature updates and improvements

## Support and Monitoring

### Alerting Setup
Configure alerts for:
- System health degradation
- High error rates (>5%)
- Payment processing failures
- Unusual traffic patterns

### Log Monitoring
Monitor logs for:
- Payment transaction errors
- Game calculation anomalies
- User authentication issues
- Performance bottlenecks

### User Feedback
- Monitor Reddit comments and feedback
- Track support requests
- Analyze user behavior patterns
- Plan improvements based on feedback

## Success Metrics

### Launch Targets (First 30 Days)
- 1,000+ unique players
- 10,000+ games played
- 5%+ conversion rate for power-ups
- <2% error rate
- >90% uptime

### Growth Targets (First 90 Days)
- 5,000+ unique players
- 50,000+ games played
- $1,000+ revenue
- Featured on Reddit gaming communities
- 4.5+ star rating from users

---

**Remember**: The payment system currently uses placeholder implementation. You MUST integrate with real Devvit Payments API before production deployment to receive actual revenue.
