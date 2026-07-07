---
name: register-success-modal
description: Custom success Modal popup and redirect flow for user registration screen
metadata: 
  node_type: memory
  type: project
  originSessionId: 84dad815-dcf4-47c8-9461-05f8777bdcd8
---

In the registration screen (`app/app/(auth)/register.tsx`), the native `Alert.alert` was replaced with a custom React Native Modal component.

**Why:**
- To improve styling consistency with the app's dark/light design system.
- To provide a modern, mobile-first success feedback card with a clear call-to-action ("Đăng nhập ngay").
- To allow automated redirect behavior, improving onboarding UX.

**How to apply:**
- The modal uses a backdrop with 50% opacity (`rgba(0, 0, 0, 0.5)`).
- When visible, it displays a success green checkmark icon (`MaterialIcons`), themed title, and description.
- Clicking the primary button redirects immediately to `/login`.
- A 3-second `setTimeout` handles auto-redirection.
- Make sure to clear the timer on component unmount or manual redirect to prevent memory leaks.
