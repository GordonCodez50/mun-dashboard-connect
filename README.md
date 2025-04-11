# ISBMUN Dashboard Application

This application serves as a dashboard for ISBMUN chairs and administrators to manage their sessions.

## Features

- **Chair Dashboard**: Manage alerts and session information
- **Timer**: Control debate timers for speakers and motions
- **File Share**: Send files to administrators via email
- **User Management**: Manage user accounts and permissions (Admin only)

## File Share Feature

The File Share feature allows chairs to send files to administrators via Gmail for printing or other purposes.

### How It Works

- The File Share page provides two options:
  - Send File for Printing
  - Send File for Other Reasons
  
- Each option opens a pre-filled Gmail compose window with appropriate recipient, subject, and body text
- Users must manually attach their files in Gmail

### Email Templates

#### Print Email Template

Email templates can be modified in the `src/pages/FileShare.tsx` file:

```typescript
// Print Email Template
const handlePrintEmail = () => {
  const recipient = 'admin-print@isbmun.com';
  const printCode = generatePrintCode(councilName);
  const subject = encodeURIComponent(`${printCode} — File for Printing`);
  const body = encodeURIComponent(
    `Dear Admin Team,\n\nPlease find the attached file for printing for the ${councilName.toUpperCase()} council. Let me know if any changes are required.\n\nRegards,\nChair – ${councilName.toUpperCase()}`
  );
  
  window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
};
```

#### Other Email Template

```typescript
// Other Email Template
const handleOtherEmail = () => {
  const recipient = 'admin-support@isbmun.com';
  const subject = encodeURIComponent(`File Share – ${councilName.toUpperCase()}`);
  const body = encodeURIComponent(
    `Dear Admins,\n\nPlease find the attached file regarding [brief description]. This is not for printing, but for your attention.\n\nRegards,\nChair – ${councilName.toUpperCase()}`
  );
  
  window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
};
```

### Print Code Construction

The print code follows this format: `#<councilname><serial><total><d1/d2>`

- **Council Name**: Extracted from the chair's email (e.g., chair-unhrc@isbmun.com → unhrc)
- **Serial**: Fixed at '00' (since tracking is disabled)
- **Total**: Fixed at '00' (since tracking is disabled)
- **d1/d2**: Determined by current date
  - d1: If date is May 16 or earlier
  - d2: If date is May 17 or later

The print code is generated in the `src/utils/emailUtils.ts` file:

```typescript
export const generatePrintCode = (councilName: string): string => {
  const serial = '00'; // Static serial value
  const total = '00';  // Static total value
  
  // Determine d1 or d2 based on current date
  const today = new Date();
  const cutoffDate = new Date(today.getFullYear(), 4, 16); // May 16 (months are 0-indexed)
  const dateCode = today <= cutoffDate ? 'd1' : 'd2';
  
  return `#${councilName}${serial}${total}${dateCode}`;
};
```

### Mailto Link Construction

The mailto links are constructed in the FileShare component using the following format:

```
mailto:recipient@example.com?subject=EncodedSubject&body=EncodedBody
```

- **To**: The email recipient
- **Subject**: URL-encoded subject line
- **Body**: URL-encoded email body

Note: File attachments must be done manually after the Gmail compose window opens, as mailto links cannot directly include attachments.
