# Remove Video Card Updated Text

## Goal

Remove the `Updated <date>` metadata from every video card while preserving the card's existing content, behavior, and chevron alignment.

## Scope

- Remove the updated-date element from the video-card footer.
- Keep the chevron right-aligned in the footer.
- Remove card-only styling that becomes unused.
- Preserve updated-date information shown elsewhere, including editing details and version history.

## Implementation

Update the `renderBoard` card template in `app/index.html` so the footer contains only the chevron. Retain the footer container because it supplies the existing right alignment. Remove the now-unused `.video-meta` CSS rule without changing shared date formatting used by other views.

## Verification

Add a regression assertion that the rendered video-card template does not contain the `Updated` metadata element. Run that focused check first and then the complete automated test suite.
