# Parked Test Scenarios

The active test suite is Vitest only:

```bash
npm test -- --run
```

Playwright browser tests were parked while the app is focused on the MVP loop. These scenarios should be rebuilt as either Vitest component tests or a fresh browser suite after the MVP stabilizes.

## Parked Browser Coverage Ideas

- Auth navigation smoke test from `/` to login and signup.
- Design token smoke test for the active visual system.
- Login form accessibility and keyboard navigation checks.
- Responsive login page checks across mobile, tablet, and desktop widths.
- Privacy settings persistence flow using a real or seeded test user.
- Privacy settings failure state when `/api/user` returns an error.
- Partner portal privacy flow where cycle and mood visibility follow sharing settings.
- Partner portal empty states for no shared data and no connected partner.
- Partner portal refresh and recent activity display.

## Parked Legacy Unit/API Coverage Ideas

- Stripe checkout session API behavior for active paid-plan work.
- Stripe webhook event handling for subscription lifecycle work.
- Full signup page and signup flow UI coverage after the auth UI stabilizes.
- Cycle logging route-level API coverage once the MVP data contract is final.

## Notes

- Old browser tests referenced parked feature data such as fantasy vault and intimacy cards.
- Old auth, Stripe, and cycle tests reflected pre-MVP contracts and were removed from the executable suite.
- The rebuilt MVP coverage should focus only on auth, cycle logging, dashboard, privacy settings, and partner privacy.
