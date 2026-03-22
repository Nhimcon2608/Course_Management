# Popup Session Dismissal System

## Overview

The popup session dismissal system provides intelligent popup management that respects user preferences while maintaining effective engagement. It distinguishes between temporary closes and permanent session dismissals, ensuring a better user experience.

## Key Features

### 1. Session-Based Dismissal
- Popups dismissed with "Don't show again" won't appear for the entire browser session
- Uses `sessionStorage` so dismissals reset when the browser session ends
- Allows popups to be effective again in new sessions

### 2. Temporary Close
- Popups closed with "Maybe later" have a short cooldown period (5 minutes)
- Can reappear after the cooldown expires
- Provides a balance between user preference and engagement opportunities

### 3. Persistent Dismissal
- Long-term dismissals stored in `localStorage` for permanent blocking
- Used for users who explicitly never want to see certain popups

## Implementation Details

### Storage Strategy

```typescript
// Session dismissals (sessionStorage)
interface SessionDismissalState {
  id: string;
  dismissedAt: number;
  dismissalType: 'close' | 'dismiss';
}

// Persistent popup states (localStorage)
interface PopupState {
  id: string;
  showCount: number;
  lastShown: number;
  dismissed: boolean;
}
```

### Dismissal Types

1. **'close'** - Temporary close with 5-minute cooldown
2. **'dismiss'** - Session-based dismissal until browser session ends
3. **Permanent dismissal** - Stored in localStorage, persists across sessions

### Priority Order

The system checks conditions in this order:
1. Session dismissal (highest priority)
2. Temporary close cooldown
3. Max show count limits
4. Cooldown periods
5. Permanent dismissal
6. Page restrictions

## Usage Examples

### Basic Popup Setup

```typescript
const { triggerPopup, closePopup } = usePopupManager();

// Trigger a popup with session dismissal support
triggerPopup({
  id: 'welcome',
  type: 'welcome',
  title: 'Welcome',
  content: (
    <WelcomePopup 
      onClose={() => closePopup('close')}           // Temporary close
      onDismiss={() => closePopup('dismiss')}       // Session dismissal
      onTemporaryClose={() => closePopup('close')}  // Explicit temporary close
    />
  ),
  trigger: { type: 'time', value: 3 },
  conditions: { maxShowCount: 3, cooldownDays: 1, userType: 'guest' },
  priority: 10,
});
```

### Popup Component Implementation

```typescript
interface PopupProps {
  onClose: () => void;        // Temporary close
  onDismiss: () => void;      // Session dismissal
  onTemporaryClose: () => void; // Explicit temporary close
}

const WelcomePopup: React.FC<PopupProps> = ({ onClose, onDismiss, onTemporaryClose }) => {
  return (
    <div>
      {/* Popup content */}
      
      <div className="flex space-x-2">
        <button onClick={onTemporaryClose}>
          Maybe later
        </button>
        <button onClick={onDismiss}>
          Don't show again
        </button>
      </div>
    </div>
  );
};
```

## Testing

### Automated Testing
Use the test suite at `/test-popups` to verify functionality:
- Session storage management
- Dismissal behavior
- Cooldown periods
- Navigation persistence

### Manual Testing Steps

1. **Session Dismissal Test**
   - Show a popup and click "Don't show again"
   - Navigate to different pages - popup should not reappear
   - Open new tab/window - popup should still be dismissed
   - Close browser and reopen - popup should be available again

2. **Temporary Close Test**
   - Show a popup and click "Maybe later"
   - Wait 5 minutes - popup should be available again
   - Navigate between pages during cooldown - popup should stay hidden

3. **Cross-Session Test**
   - Dismiss popup in one session
   - Open new browser window/tab
   - Verify popup is still dismissed in same session
   - Close all browser windows and reopen
   - Verify popup can appear in new session

## Debug Tools

### Development Debug Panel
- Available on home page in development mode
- Shows real-time session dismissal states
- Provides manual testing controls
- Displays cooldown timers

### Browser DevTools
```javascript
// Check session dismissals
JSON.parse(sessionStorage.getItem('popup_session_dismissals') || '{}')

// Check persistent states
JSON.parse(localStorage.getItem('popup_states') || '{}')

// Clear session dismissals
sessionStorage.removeItem('popup_session_dismissals')
```

## Best Practices

### 1. User Experience
- Always provide both temporary and permanent dismissal options
- Use clear, descriptive button text
- Respect user choices consistently
- Don't show dismissed popups too frequently

### 2. Implementation
- Use session dismissal for most cases
- Reserve permanent dismissal for explicit user requests
- Implement reasonable cooldown periods
- Test across different browsers and scenarios

### 3. Analytics
- Track dismissal rates to optimize popup timing
- Monitor user engagement after dismissals
- A/B test different dismissal strategies

## Browser Compatibility

- **sessionStorage**: Supported in all modern browsers
- **localStorage**: Supported in all modern browsers
- **Fallback**: System gracefully degrades if storage is unavailable

## Security Considerations

- No sensitive data stored in browser storage
- Storage data is domain-specific
- Users can manually clear storage data
- No server-side dependencies for basic functionality

## Performance Impact

- Minimal memory usage (small JSON objects)
- No network requests for dismissal tracking
- Efficient lookup operations
- Automatic cleanup on session end
