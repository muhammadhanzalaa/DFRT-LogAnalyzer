# Quick Troubleshooting Guide

## If drag-and-drop isn't working

**Problem**: Files can't be dragged and dropped  
**Solution**:
1. Ensure you're on the "Upload Files" step (Step 2)
2. The upload zone should highlight when dragging over it
3. Try the "Browse Files" button instead
4. Check browser console for any JavaScript errors

---

## If file selection doesn't work

**Problem**: Browse Files button doesn't open file picker  
**Solution**:
1. Check browser console: `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac)
2. Look for errors related to file input
3. Try refreshing the page
4. Clear browser cache if issues persist

---

## If Step 3 doesn't appear

**Problem**: Options configuration step missing  
**Solution**:
1. Make sure you've selected files in Step 2
2. Click "Next" button (should be enabled after file selection)
3. If step still doesn't appear, check Step 1 and 2 are complete
4. Refresh page if needed

---

## If analysis doesn't start

**Problem**: Clicking "Start Analysis" button doesn't work  
**Solution**:
1. Verify all 4 steps are complete
2. Check analysis name is not empty
3. Check at least one file is selected
4. Wait for file upload to complete (modal shows "Analyzing Logs")
5. Check network tab in developer tools
6. Ensure server is running: `npm start`

---

## Server won't start

**Problem**: `npm start` fails with errors  
**Solution**:
1. Clear node_modules: `rm -rf node_modules`
2. Reinstall dependencies: `npm install`
3. Check Node.js version: `node --version` (should be 14+)
4. Check port 3000 isn't in use: `lsof -i :3000`
5. Check logs for specific errors

---

## Files appear but analysis doesn't process

**Problem**: Files upload but don't get analyzed  
**Solution**:
1. Check if fallback analyzer loaded: Look for "Native addon not found" in logs
2. Verify database is initialized
3. Check files aren't too large (max 100MB each)
4. Check file formats are supported (.log, .csv, .json, .txt, .evtx, .xml)
5. Try smaller file first for testing

---

## No results shown after analysis

**Problem**: Analysis completes but results page is empty  
**Solution**:
1. Ensure analysis actually completed (check network tab)
2. Try refreshing results page
3. Select analysis from dropdown on results page
4. Check browser console for errors
5. Verify database has data: Check logs for entry count

---

## Server errors in console

**Problem**: Getting database or analyzer errors  
**Solution**:
1. **"Database path required"** - This is normal for tests, ignore
2. **"better-sqlite3 not available"** - Using in-memory DB, normal
3. **"File not found"** - Check uploaded file path
4. **"Analysis failed"** - Check file format and size

---

## Testing the Fix

**Quick Test Steps:**
```bash
# 1. Start server
npm start

# 2. Open browser
http://localhost:3000

# 3. Navigate to Analyze page

# 4. Test drag-drop:
#    - Drag a .log or .txt file to upload zone
#    - Should highlight and accept drop

# 5. Test browse:
#    - Click "Browse Files" button
#    - Select one or more files from computer

# 6. Complete workflow:
#    - Step 1: Select log type
#    - Step 2: Upload files (drag-drop or browse)
#    - Step 3: Configure options (if desired)
#    - Step 4: Review and start analysis
#    - Should redirect to Results page

# 7. Verify no errors:
#    - Check browser console (F12 → Console)
#    - Check server logs
```

---

## Files Changed

| File | Purpose | Status |
|------|---------|--------|
| `src/frontend/js/pages/analyze.js` | Analyze wizard logic | ✅ Fixed |
| `src/backend/middleware/upload.middleware.js` | File upload handler | ✅ Fixed |
| `src/backend/services/analyzer.fallback.js` | JS fallback analyzer | ✅ Fixed |

---

## Key Improvements

✅ **Drag-and-drop**: Proper event handling with visual feedback  
✅ **File selection**: Browse button works, flexible field handling  
✅ **Step navigation**: All 4 wizard steps display correctly  
✅ **Analysis execution**: Files properly sent with correct parameters  
✅ **Fallback analyzer**: Syntax fixed, server starts successfully  

---

## Getting Help

1. **Check logs**: `npm start` output or browser console (F12)
2. **Read docs**: `BUGFIXES_SUMMARY.md` and `TECHNICAL_IMPLEMENTATION.md`
3. **Check git history**: `git log` for detailed commit messages
4. **Verify setup**: Run `npm test` to ensure everything works

---

## Contact & Support

For issues not covered here:
1. Check the detailed technical documentation
2. Review git commit messages for what changed
3. Run tests to isolate the problem: `npm test`
4. Check if issue existed before fixes: `git diff HEAD~3`

---

**Last Updated:** January 4, 2026  
**Fixes Applied:** cb5fbc7, 7d4b9b5, aafd0ef  
**Status:** ✅ All issues resolved
