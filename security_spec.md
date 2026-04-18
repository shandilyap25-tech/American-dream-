# Security Spec: Venue Booking System

## Data Invariants
1. A booking must have a valid `userId` matching the authenticated user.
2. A booking must have a valid ISO date.
3. Users can only read and write their own bookings.
4. Terminal states ('confirmed', 'cancelled') can only be set by admins (or through a system process, but for this demo, we'll allow users to create 'pending' bookings).

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: `userId` in payload != `request.auth.uid`.
2. **Resource Poisoning**: `bookingId` is a 2KB string of junk characters.
3. **Invalid State**: User attempts to create a booking with `status: "confirmed"`.
4. **Invalid Type**: `date` is a boolean instead of a string.
5. **Unauthorized Read**: User A tries to `get` User B's booking.
6. **Shadow Update**: User tries to add an `isAdmin: true` field to their booking.
7. **Bypass Query Enforcer**: User tries to `list` all bookings without filtering by `userId`.
8. **Time Poisoning**: `createdAt` is a hardcoded future date instead of `serverTimestamp()`.
9. **Missing Required Field**: Creating a booking without `venueId`.
10. **Malicious ID Injection**: `venueId` contains SQL-like injection characters (though not applicable to Firestore, but good for ID hygiene).
11. **Overwrite Protection**: User tries to change their `userId` on an existing booking.
12. **PII Leak**: Unauthenticated user tries to `list` any booking.

## Test Runner (firestore.rules)
*To be implemented in next step*
