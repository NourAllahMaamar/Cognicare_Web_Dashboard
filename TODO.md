Create a complete Support Ticket (Contact Us / Feedback)

Context:
- The app already has a User model with roles: specialist, organization_leader, admin, etc.
- This feature is for specialists and organization leaders to:
  - report bugs
  - send suggestions
  - contact admins
- Admins will manage tickets from an admin dashboard.

Requirements:

1. Create a Mongoose schema called SupportTicket with:
- userId (ObjectId, ref User, required)
- role
- type: 'bug' | 'suggestion' | 'contact'
- subject (string, required)
- description (string, required)
- status: 'open' | 'in_progress' | 'resolved' (default: open)
- priority: 'low' | 'medium' | 'urgent' (optional)
- messages: array of objects:
    - sender: 'user' | 'admin'
    - message: string
    - createdAt: Date
- attachments: string[] (optional ,pdf or screenshot image)
- timestamps

2. Create DTOs:
- CreateTicketDto
- AddMessageDto
- UpdateStatusDto

3. Create a Support module with:
- support.controller.ts
- support.service.ts

4. Implement USER endpoints:
- POST /support → create ticket
- GET /support/my-tickets → get logged-in user's tickets
- GET /support/:id → get ticket details (only if owned by user)
- POST /support/:id/message → user adds message

5. Implement ADMIN endpoints:
- GET /admin/support → get all tickets with filters (status, type, role)
- PATCH /support/:id/status → update ticket status
- POST /support/:id/message → admin reply

6. Add Guards:
- Use AuthGuard (JWT)
- Only allow admins to access admin endpoints
- Ensure users can only access their own tickets

7. Business logic:
- When creating a ticket, automatically add the first message from user into messages[]
- When replying, push message into messages array
- Sort tickets by createdAt DESC
- Populate user basic info when admin fetches tickets

8. Error handling:
- Throw 404 if ticket not found
- Throw 403 if user tries to access another user's ticket

9. Keep code clean and modular:
- Use proper services
- Use async/await
- Add types and interfaces

10. Optional (if possible):
- Add pagination for admin tickets
- Add filtering by status/type

Don't forget to be translatable en fr ar