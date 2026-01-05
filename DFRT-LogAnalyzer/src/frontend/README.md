# DFRT Log Analyzer - Frontend Documentation

## Overview

The DFRT Log Analyzer frontend is a modern, responsive web application built with vanilla JavaScript, HTML5, and CSS3. It provides an intuitive interface for uploading, analyzing, and visualizing security log data.

## Architecture

### Directory Structure

```
src/frontend/
├── css/
│   ├── variables.css      # Design system: colors, typography, spacing
│   ├── global.css         # Global styles: buttons, forms, components
│   └── layout.css         # Layout: header, sidebar, main content
├── js/
│   ├── config.js          # Configuration and constants
│   ├── core/
│   │   ├── api-client.js         # API communication with error handling
│   │   ├── state-manager.js      # Centralized state management
│   │   ├── ui-notifications.js   # Toast, modals, alerts
│   │   └── utils.js              # Utility functions
│   └── pages/
│       ├── dashboard.js          # Dashboard page logic
│       ├── analyze-enhanced.js    # Multi-step file upload wizard
│       ├── results-enhanced.js    # Results table with filtering
│       ├── threats-enhanced.js    # Threat visualization
│       ├── timeline-enhanced.js   # Event timeline
│       └── settings-enhanced.js   # Application settings
├── index.html             # Dashboard page
├── analyze.html           # Analysis wizard
├── results.html           # Results display
├── threats.html           # Threat analysis
├── timeline.html          # Event timeline
└── settings.html          # Settings page
```

## Core Systems

### 1. Design System (variables.css)

Comprehensive CSS variables for consistent design:

- **Colors**: Primary, secondary, status colors (success, warning, danger, info)
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: 8px-based scale (8px to 96px)
- **Shadows**: Elevation-based shadows
- **Transitions**: Timing and easing functions
- **Layout**: Sidebar widths, header/footer heights
- **Z-Index**: Layering scale for modals, dropdowns, etc.

**Dark Mode Support**: Uses CSS custom properties with media query and `data-theme` attribute

### 2. Global Styles (global.css)

Foundational components and utilities:

- **Reset & Normalization**: Browser consistency
- **Typography**: Heading, paragraph, code styles
- **Buttons**: Primary, secondary, danger, success, warning variants with sizes
- **Forms**: Input, select, checkbox, textarea with proper styling
- **Cards**: Container components with headers/footers
- **Grid & Flex**: Utility classes for layout
- **Spacing**: Margin and padding utilities
- **Badges & Alerts**: Status indicators
- **Modals & Dialogs**: Overlay components
- **Toasts & Notifications**: User feedback
- **Responsive Utilities**: Show/hide at different breakpoints

### 3. Layout (layout.css)

Main application layout structure:

- **App Container**: CSS Grid layout with header, sidebar, main, footer
- **Header**: Sticky navigation bar
- **Sidebar**: Collapsible navigation menu
- **Main Content**: Scrollable content area
- **Footer**: Fixed footer bar
- **Responsive**: Adapts to mobile, tablet, and desktop
- **Mobile Overlay**: Sidebar becomes overlay on small screens

### 4. API Client (api-client.js)

Robust API communication layer:

```javascript
// Global instance
API.get('/api/endpoint')
API.post('/api/endpoint', { data })
API.uploadFile('/api/upload', file)

// Features:
- Automatic error handling
- Request queuing for offline mode
- Upload progress tracking
- Auth token management
- Timeout handling
- Network error recovery
```

### 5. State Manager (state-manager.js)

Centralized, reactive state management:

```javascript
// Global instances
AppState.set('user.name', 'John')
AppState.get('user.name')
AppState.subscribe(callback, 'user')

AnalysisState.startLoading()
AnalysisState.setError(error)
AnalysisState.addAnalysis(analysis)
```

**Features:**
- Path-based getter/setter
- Observer pattern for reactive updates
- History/undo capability
- localStorage persistence

### 6. UI Notifications (ui-notifications.js)

User feedback system:

```javascript
// Toasts
UINotifications.showSuccess('Title', 'Message')
UINotifications.showError('Title', 'Message')
UINotifications.showWarning('Title', 'Message')
UINotifications.showInfo('Title', 'Message')

// Dialogs
await UINotifications.confirm('Title', 'Message')
await UINotifications.prompt('Title', 'Message', defaultValue)
await UINotifications.alert('Title', 'Message')

// Loading
const id = UINotifications.showLoading('Loading...')
UINotifications.removeToast(id)
```

### 7. Utilities (utils.js)

Helper functions for common tasks:

```javascript
// Debounce/Throttle
Utils.debounce(func, wait)
Utils.throttle(func, limit)

// Date/Time
Utils.formatDate(date, 'YYYY-MM-DD HH:mm:ss')
Utils.formatRelativeTime(date)

// Files
Utils.formatBytes(bytes)
Utils.downloadFile(content, filename)

// Validation
Utils.isValidEmail(email)
Utils.isValidIP(ip)

// Collections
Utils.cloneDeep(obj)
Utils.merge(target, ...sources)

// Data
Utils.csvToArray(str)
Utils.jsonToCsv(data)
```

## Page Components

### Dashboard (index.html)

Main dashboard with overview statistics and quick navigation.

- **Components**: Statistics widgets, feature list, getting started guide
- **Features**: Quick navigation to main sections
- **Responsive**: Grid-based layout adapts to screen size

### Analyze (analyze.html)

Multi-step wizard for log file upload and analysis configuration.

- **Step 1**: File upload with drag-drop support
- **Step 2**: Log type selection (Windows Event, Syslog, Apache, Nginx, JSON, Generic)
- **Step 3**: Analysis options and configuration
- **Step 4**: Review and start analysis

**Features:**
- Drag-and-drop file upload
- File size validation
- Multiple file support
- Configurable analysis parameters
- Progress tracking

### Results (results.html)

Detailed analysis results with filtering and export.

- **Components**: Summary statistics, filter controls, data table
- **Features**: 
  - Pagination with configurable page size
  - Multi-column filtering
  - Sorting
  - Export functionality
  - Responsive table

### Threats (threats.html)

Threat detection and analysis visualization.

- **Tabs**: Brute force attacks, log tampering, anomalies, suspicious activity
- **Features**: Threat visualization, severity indicators, detailed information
- **Export**: Export threat reports

### Timeline (timeline.html)

Event timeline reconstruction and correlation.

- **Features**: Chronological event view, date filtering, user filtering
- **Visualization**: Timeline display with event details
- **Export**: Download timeline data

### Settings (settings.html)

Application preferences and configuration.

- **Tabs**: General, Analysis, Notifications, About
- **Features**: 
  - Theme selection (light/dark)
  - Page size configuration
  - Auto-refresh settings
  - Notification preferences
  - Default analysis parameters

## Responsive Design

The application uses a mobile-first approach with CSS Grid and Flexbox:

### Breakpoints

- **Mobile**: 0-640px
- **Tablet**: 641px-768px  
- **Desktop**: 769px+

### Layout Changes

- **Mobile**: Single column, overlay sidebar, touch-friendly buttons
- **Tablet**: Two-column grid for panels
- **Desktop**: Full responsive grid with sidebar

## Performance Optimizations

1. **CSS Variables**: Reduces file size and enables theme switching
2. **Debouncing**: Prevents excessive function calls on input
3. **Lazy Loading**: Load resources on demand
4. **Caching**: API responses cached in localStorage
5. **Offline Support**: Queue requests when offline
6. **Minified Assets**: Ready for production

## Accessibility Features

- **Semantic HTML5**: Proper heading hierarchy, semantic elements
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Tab through interactive elements
- **Focus Indicators**: Clear focus states
- **Color Contrast**: WCAG AA compliance
- **Form Labels**: Associated labels for all inputs

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Development

### Setup

```bash
# No build process required - vanilla JavaScript
# Simply serve the frontend directory over HTTP
python -m http.server 8000
# or
npx http-server
```

### Adding New Features

1. **Component Structure**:
   - Create HTML element in appropriate `.html` file
   - Add CSS to `css/layout.css` for page-specific styles
   - Create JavaScript in `js/pages/` for page logic

2. **State Management**:
   - Use `AppState` or `AnalysisState` for data
   - Subscribe to changes with `.subscribe(callback)`
   - Persist important data with `.persist(key)`

3. **API Integration**:
   - Use `API.get()`, `API.post()`, etc.
   - Handle errors with try/catch
   - Show user feedback with `UINotifications`

4. **Styling**:
   - Use CSS variables for consistency
   - Follow spacing/sizing conventions
   - Test on mobile and desktop

## Testing Checklist

- [ ] All pages load without errors
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Forms validate input correctly
- [ ] API calls handle errors gracefully
- [ ] Notifications display properly
- [ ] File upload works with drag-drop
- [ ] Offline mode queues requests
- [ ] Dark/light theme toggle works
- [ ] All links navigate correctly
- [ ] Sidebar collapses on mobile

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live analysis updates
2. **Advanced Visualization**: Charts and graphs for threat data
3. **Export Formats**: PDF and Excel export
4. **Batch Operations**: Process multiple analyses
5. **User Authentication**: Login and user management
6. **Collaboration**: Share analyses with team members
7. **Custom Reports**: Report builder UI
8. **API Documentation**: Interactive API explorer

## Troubleshooting

### Toasts not appearing
- Check `#toastContainer` exists in HTML
- Verify `UINotifications` script is loaded

### State not updating
- Ensure using `.set()` method not direct assignment
- Check observer callbacks are registered

### API errors
- Check network tab for request/response
- Verify API endpoint URLs
- Check console for error messages

### Styling issues
- Clear browser cache
- Check CSS variable values
- Verify media query breakpoints
- Test in incognito mode

## License

MIT License - See LICENSE file for details
