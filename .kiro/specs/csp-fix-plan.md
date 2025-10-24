# CSP and Performance Issues Fix Plan

## Problem Analysis

The game is experiencing persistent Content Security Policy (CSP) violations and performance warnings despite multiple attempts to fix them. The core issues are:

1. **CSP Violations**: "Refused to execute inline script" - There's still inline JavaScript somewhere
2. **Non-passive Event Listeners**: Touch/scroll events are blocking the main thread
3. **Performance**: setTimeout handlers taking too long
4. **Meta Tag Deprecation**: Old mobile web app meta tags

## Root Cause Investigation

### Current Error Sources:

- **DQ8yQwza.js:2** - This is Reddit's own JavaScript causing violations
- **Lemonomics/:55** - Line 55 in our HTML has inline script
- **Template literals in JavaScript** - May be causing CSP issues
- **Event listeners** - Not marked as passive for touch events

## Systematic Fix Plan

### Phase 1: Eliminate ALL Inline JavaScript

- [ ] Remove any remaining inline scripts from HTML
- [ ] Convert all template literals to DOM manipulation
- [ ] Use only external JavaScript files
- [ ] Add CSP-compliant event listeners

### Phase 2: Optimize Event Listeners

- [ ] Mark touch/scroll event listeners as passive
- [ ] Reduce setTimeout usage
- [ ] Use requestAnimationFrame for animations
- [ ] Debounce user input events

### Phase 3: Clean HTML Structure

- [ ] Update deprecated meta tags
- [ ] Remove any inline styles that might cause issues
- [ ] Ensure all JavaScript is in external files
- [ ] Validate HTML structure

### Phase 4: Performance Optimization

- [ ] Reduce DOM manipulation frequency
- [ ] Cache DOM elements
- [ ] Use efficient CSS for styling
- [ ] Minimize JavaScript execution time

## Implementation Strategy

### Step 1: Create Ultra-Clean HTML

Create the simplest possible HTML with:

- No inline JavaScript whatsoever
- No template literals in external JS
- Modern meta tags
- Minimal inline CSS

### Step 2: Rebuild JavaScript with CSP Compliance

- Use only `document.createElement()` and `appendChild()`
- No `innerHTML` with complex content
- No template literals for HTML generation
- Passive event listeners where appropriate

### Step 3: Test and Validate

- Check browser console for any remaining violations
- Verify game functionality works correctly
- Test on mobile devices for touch events
- Monitor performance metrics

## Success Criteria

✅ **Zero CSP violations** in browser console  
✅ **Zero performance warnings** about event listeners  
✅ **Game functions correctly** with all features working  
✅ **Fast loading** and responsive interface  
✅ **Mobile-friendly** touch interactions

## Implementation Priority

1. **CRITICAL**: Fix CSP violations (blocks game functionality)
2. **HIGH**: Fix event listener warnings (affects performance)
3. **MEDIUM**: Update meta tags (improves compatibility)
4. **LOW**: Optimize performance further (nice to have)

This plan will systematically address each issue to create a fully compliant, high-performance lemonade stand game.
