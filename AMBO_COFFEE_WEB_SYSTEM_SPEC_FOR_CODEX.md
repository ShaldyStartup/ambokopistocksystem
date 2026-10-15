# Ambo Coffee Inventory Stock Management System
## Web Application Specification for Codex

> Purpose: This document is a build specification for Codex to create a web-based inventory stock management system for Ambo Coffee.
> Scope: The system focuses on inventory recording, inventory monitoring, stock history, low-stock alerts, and inventory information for staff and owner/manager.
> Important: Do not expand the scope into POS replacement, accounting, payroll, customer ordering, supplier purchasing, or full procurement unless explicitly requested later.

---

## 1. Project Overview

Ambo Coffee currently performs stock checking manually at the end of a shift. Staff/barista count physical inventory and record the remaining quantity. The proposed system should replace the unstructured manual recording process with a simple web-based inventory system.

The system should support two primary roles:

1. **Staff / Barista**
   - Record actual stock quantities after physical stock checking.
   - Submit stock adjustments when needed.
   - View the latest stock quantities.
   - View confirmation after a stock record is saved.

2. **Owner / Manager**
   - View inventory status.
   - View stock history.
   - Configure inventory items.
   - Configure minimum stock thresholds.
   - View low-stock alerts.
   - View simple inventory reports.

The application should remain simple because it is intended for a small coffee shop operation.

---

## 2. Main System Goal

Create a simple, reliable, and easy-to-use web application that helps Ambo Coffee:

- Record stock after physical stock counting.
- Store inventory records in a centralized database.
- Maintain the latest quantity of each inventory item.
- Keep a historical record of stock changes.
- Detect items whose stock has reached or fallen below a configured minimum threshold.
- Allow owner/manager to review inventory information without relying on manual chat records.

---

## 3. Scope

### 3.1 In Scope

- User authentication.
- Role-based access for Staff/Barista and Owner/Manager.
- Inventory item management.
- Manual stock count entry.
- Manual stock adjustment.
- Current inventory quantity.
- Minimum stock threshold configuration.
- Low-stock status.
- Stock movement/history.
- Inventory dashboard.
- Inventory reports.
- Search and filtering.
- Responsive web interface.
- Basic audit information such as user, date, and time of stock updates.

### 3.2 Out of Scope

Do not implement these features unless requested later:

- POS replacement.
- Automatic stock deduction from sales transactions.
- Payment processing.
- Accounting or bookkeeping.
- Customer ordering.
- Supplier purchasing workflow.
- Purchase orders.
- Supplier portal.
- Employee payroll.
- Attendance.
- Production planning.
- IoT or automatic stock sensors.
- Multi-branch inventory synchronization.
- AI forecasting.
- Advanced demand prediction.

The current version should focus only on the inventory system.

---

## 4. Business Process

### 4.1 Current Operational Pattern

At the end of a shift:

1. Staff/barista physically check inventory.
2. Staff/barista count the remaining quantity of each item.
3. The stock quantity is recorded manually.
4. The information is used as the latest stock reference.

### 4.2 Proposed TO-BE Process

1. Staff/barista finishes the shift.
2. Staff/barista performs a physical stock check.
3. Staff/barista counts the remaining quantity.
4. Staff/barista logs into the web application.
5. Staff/barista opens the stock recording page.
6. Staff/barista enters the actual quantity for each checked item.
7. The system validates the input.
8. The system saves the stock record.
9. The system updates the current stock quantity.
10. The system compares the current quantity with the item's minimum stock threshold.
11. If the quantity is less than or equal to the minimum threshold, the system marks the item as low stock.
12. Owner/manager can review current stock, stock history, and low-stock items.

---

## 5. DFD-Based Functional Structure

The web system should reflect the following logical processes.

### Process 1.0 — Record Stock Data

Purpose:
- Receive stock check data from Staff/Barista.
- Validate stock input.
- Save stock records.
- Update the current stock quantity.
- Return a stock recording confirmation.

Inputs:
- Stock Check Data.
- Stock Adjustment Data.

Outputs:
- Stock Recording Confirmation.
- Updated Stock Data.

### Process 2.0 — Manage Inventory Data

Purpose:
- Manage inventory item information.
- Manage minimum stock thresholds.
- Maintain the current inventory master data.

Inputs:
- Inventory Configuration Data.
- Updated Stock Data.

Outputs:
- Current Inventory Data.
- Updated Item Data.

### Process 3.0 — Provide Inventory Information

Purpose:
- Provide inventory status and stock information.
- Provide low-stock alerts.
- Provide stock history and simple reports.

Inputs:
- Inventory Information Request.
- Current Inventory Data.
- Stock History Data.

Outputs:
- Inventory Information.
- Low Stock Alert.

---

## 6. User Roles and Permissions

### 6.1 Staff / Barista

Allowed:
- Login.
- View dashboard summary relevant to stock.
- View inventory items.
- Record stock count.
- Create stock adjustment.
- View recent stock history.
- View low-stock items.
- View their own recent submissions.

Not allowed by default:
- Create or delete users.
- Change user roles.
- Delete historical stock records.
- Change minimum stock threshold.
- Delete inventory items.
- Access administrative settings.

### 6.2 Owner / Manager

Allowed:
- All staff permissions.
- Create inventory items.
- Edit inventory items.
- Activate/deactivate inventory items.
- Configure minimum stock threshold.
- View all stock history.
- View low-stock alerts.
- View inventory reports.
- Manage staff accounts if user management is implemented.
- View audit information.

Avoid permanent deletion of important inventory or stock history. Prefer status-based deactivation.

---

## 7. Required Pages

### 7.1 Login Page

Route example:

`/login`

Fields:
- Email or username.
- Password.

Actions:
- Login.
- Logout after authentication.

Requirements:
- Show clear validation messages.
- Do not reveal whether a specific account exists in security-sensitive error messages.

### 7.2 Dashboard

Route example:

`/dashboard`

Display:
- Total active inventory items.
- Number of low-stock items.
- Number of stock updates today.
- Last stock update date/time.
- Low-stock item list.
- Recently updated inventory.
- Quick action button: **Record Stock**.

Owner/Manager may also see:
- Inventory summary.
- Recent stock movements.
- Simple stock status chart.

Keep the dashboard simple and operational rather than decorative.

### 7.3 Inventory List

Route example:

`/inventory`

Table columns:
- Item Name.
- Category.
- Unit.
- Current Stock.
- Minimum Stock.
- Status.
- Last Updated.
- Actions.

Status:
- `Normal`
- `Low Stock`
- `Inactive`

Low Stock rule:

```text
current_stock <= minimum_stock
```

Features:
- Search by item name.
- Filter by category.
- Filter by stock status.
- Sort by item name, quantity, or last updated.
- Responsive table/card view for mobile.

### 7.4 Add Inventory Item

Route example:

`/inventory/new`

Owner/Manager only.

Fields:
- Item Name.
- Category.
- Unit.
- Initial Stock.
- Minimum Stock.
- Notes.
- Active Status.

Possible units:
- kg
- gram
- liter
- ml
- pcs
- pack
- bottle
- box
- other

Do not hardcode coffee-specific units only.

### 7.5 Inventory Item Detail

Route example:

`/inventory/[id]`

Display:
- Item name.
- Category.
- Unit.
- Current stock.
- Minimum stock.
- Current status.
- Notes.
- Last updated information.
- Recent stock history.

Owner/Manager actions:
- Edit item.
- Update minimum stock.
- Deactivate item.

### 7.6 Record Stock Count

Route example:

`/stock-count`

Primary Staff/Barista workflow.

Requirements:
- Show active inventory items.
- Show previous/current recorded quantity.
- Provide a quantity input for each checked item.
- Allow partial stock count if not every item is checked.
- Require a shift/date reference.
- Allow optional notes.
- Show validation before submission.
- Ask for confirmation before final save.

Suggested fields per entry:
- Item.
- Actual Quantity.
- Unit.
- Previous Quantity.
- Difference.
- Notes.

On submit:
1. Validate all numeric values.
2. Reject negative stock unless explicitly allowed through an adjustment workflow.
3. Create a Stock Record.
4. Update Inventory Item current stock.
5. Evaluate low-stock status.
6. Show success confirmation.

---

## 8. Stock Adjustment

Route example:

`/stock-adjustment`

Use this for corrections or manual adjustments that are different from a normal end-of-shift stock count.

Adjustment Types:
- Addition.
- Reduction.
- Correction.

Fields:
- Inventory Item.
- Adjustment Type.
- Quantity.
- Reason.
- Notes.

Examples of reasons:
- Restock received.
- Damaged item.
- Wastage.
- Manual correction.
- Other.

Every adjustment must create an immutable history record.

Never silently modify stock without creating a stock-history entry.

---

## 9. Stock History

Route example:

`/stock-history`

Columns:
- Date & Time.
- Item.
- Record Type.
- Previous Quantity.
- New Quantity.
- Difference.
- Unit.
- Recorded By.
- Notes.

Record types:
- Stock Count.
- Stock Addition.
- Stock Reduction.
- Correction.
- Initial Stock.

Filters:
- Date range.
- Item.
- Record type.
- User.
- Stock status.

Owner/Manager can access all records.

Staff/Barista may access recent records based on permission settings.

---

## 10. Low Stock Alerts

Route example:

`/alerts`

A low-stock alert is generated logically when:

```text
current_stock <= minimum_stock
```

Display:
- Item Name.
- Current Stock.
- Minimum Stock.
- Unit.
- Last Updated.
- Status.

For the first version, an in-app low-stock list is enough.

Do not implement WhatsApp, email, SMS, or push notifications unless requested later.

The system should visually highlight low-stock items on:
- Dashboard.
- Inventory list.
- Item detail.
- Alerts page.

---

## 11. Reports

Route example:

`/reports`

Keep reports simple.

### Inventory Status Report

Show:
- Item.
- Current Stock.
- Minimum Stock.
- Status.
- Last Updated.

### Stock Movement Report

Show:
- Date.
- Item.
- Previous Quantity.
- New Quantity.
- Difference.
- Type.
- Recorded By.

Filters:
- Date range.
- Item.
- Category.
- Status.

Optional:
- CSV export.
- Print-friendly report.

Do not create complex financial reports.

---

## 12. Suggested Data Model

Use a relational database.

### 12.1 Users

```text
users
- id
- name
- email
- password_hash / auth_provider_id
- role
- active
- created_at
- updated_at
```

Role values:

```text
staff
owner
manager
```

If using an authentication provider such as Supabase Auth, do not store raw passwords in an application table.

### 12.2 Inventory Categories

```text
inventory_categories
- id
- name
- description
- active
- created_at
- updated_at
```

Examples may include:
- Coffee Beans.
- Milk.
- Syrup.
- Packaging.
- Food Ingredients.
- Other.

Treat these only as examples; they should be editable.

### 12.3 Inventory Items

```text
inventory_items
- id
- category_id
- name
- unit
- current_stock
- minimum_stock
- notes
- active
- created_at
- updated_at
- updated_by
```

Constraints:

```text
current_stock >= 0
minimum_stock >= 0
```

Low-stock status should preferably be derived rather than permanently stored:

```text
is_low_stock = current_stock <= minimum_stock
```

### 12.4 Stock Records

```text
stock_records
- id
- inventory_item_id
- record_type
- previous_quantity
- quantity_change
- new_quantity
- shift_date
- notes
- recorded_by
- created_at
```

Possible `record_type` values:

```text
stock_count
addition
reduction
correction
initial
```

Stock records should be append-only for normal users.

### 12.5 Optional Shift Records

Only create this table if needed by the UI implementation.

```text
shift_records
- id
- shift_date
- shift_name
- submitted_by
- submitted_at
- notes
```

Possible shift names:

```text
morning
afternoon
night
```

Do not assume all three shifts exist operationally. Make the values configurable or use free-form shift labels if needed.

---

## 13. Data Integrity Rules

1. Inventory quantity cannot be null.
2. Minimum stock cannot be negative.
3. Current stock cannot become negative through a normal stock operation.
4. Each stock change must create a stock record.
5. Stock history must preserve who created the record.
6. Stock history must preserve creation date/time.
7. Historical stock records should not be deleted through the regular UI.
8. Only authorized roles may modify inventory configuration.
9. Deactivated items should remain visible in historical reports.
10. Changing minimum stock must not rewrite historical stock data.

---

## 14. Authentication and Authorization

Required:
- Secure authentication.
- Protected routes.
- Role-based access control.
- Session handling.
- Logout.
- Server-side permission checks.

Do not rely only on hiding UI buttons.

For example:

```text
Staff tries to access /inventory/new
→ Server checks role
→ Access denied if user is not Owner/Manager
```

---

## 15. Suggested Technical Stack

If there is no existing project stack, use:

### Frontend
- Next.js
- TypeScript
- React
- Tailwind CSS

### Backend
Prefer:
- Next.js server actions / route handlers

or an equivalent clean API layer.

### Database / Authentication
Recommended for fast project development:
- Supabase PostgreSQL
- Supabase Auth

Alternative:
- PostgreSQL
- Prisma ORM
- NextAuth/Auth.js

Codex should first inspect the repository. If an existing compatible stack already exists, preserve it instead of replacing it unnecessarily.

---

## 16. Suggested Project Structure

```text
src/
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── inventory/
│   │   ├── page.tsx
│   │   ├── new/
│   │   └── [id]/
│   ├── stock-count/
│   ├── stock-adjustment/
│   ├── stock-history/
│   ├── alerts/
│   ├── reports/
│   └── api/
├── components/
│   ├── layout/
│   ├── inventory/
│   ├── stock/
│   ├── dashboard/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validation/
│   └── permissions/
├── types/
└── utils/
```

Do not create unnecessary abstraction for a small project.

---

## 17. UI / UX Direction

The interface should feel suitable for a small modern coffee shop.

Design characteristics:
- Clean.
- Minimal.
- Easy to learn.
- Mobile-friendly.
- Fast to use during operation.
- Clear stock status indicators.
- Large enough input controls for mobile/tablet use.

Suggested visual direction:
- Neutral light background.
- Warm coffee-inspired accent colors.
- Strong text contrast.
- Simple cards.
- Clear tables.
- Minimal animations.

Do not make the application visually heavy.

### Mobile Priority

Staff may use the system from a phone.

The Stock Count page must be easy to use on a mobile screen.

Important mobile behavior:
- Large quantity input.
- Item name clearly visible.
- Unit displayed next to quantity.
- Sticky save/submit button when practical.
- Avoid horizontal scrolling for core workflows.

---

## 18. Navigation

Suggested sidebar/navigation:

```text
Dashboard
Inventory
Record Stock
Stock Adjustment
Stock History
Low Stock Alerts
Reports
```

Owner/Manager additional menu:

```text
Manage Inventory
Settings
```

Keep navigation role-aware.

---

## 19. Validation Rules

### Inventory Item
- Name is required.
- Unit is required.
- Minimum stock must be a number >= 0.
- Initial stock must be a number >= 0.

### Stock Count
- Item is required.
- Quantity is required.
- Quantity must be numeric.
- Quantity cannot be negative.
- Date is required.

### Adjustment
- Item is required.
- Adjustment type is required.
- Quantity must be greater than 0.
- Reason is required.

Display validation errors next to the relevant field.

---

## 20. Empty, Loading, and Error States

Every important page must handle:

### Empty State

```text
No inventory items found.
Add your first inventory item to begin tracking stock.
```

### Loading State
Use skeletons or simple loading indicators.

### Error State

```text
Unable to save the stock record. Please try again.
```

Do not expose stack traces, database errors, SQL statements, or internal secrets to users.

---

## 21. Auditability

For every inventory-changing action, record:
- User.
- Date/time.
- Item.
- Previous stock.
- New stock.
- Difference.
- Action type.
- Optional notes.

This is important because the system is replacing informal manual stock records.

---

## 22. Suggested Dashboard Logic

```text
total_items =
count(active inventory items)

low_stock_items =
count(active items where current_stock <= minimum_stock)

updates_today =
count(stock records created today)

last_update =
latest stock record created_at
```

Recent activity:

```text
latest 5–10 stock records
```

Low-stock section:

```text
items where current_stock <= minimum_stock
order by current_stock / minimum_stock ascending
```

Be careful when minimum_stock = 0. Do not divide by zero.

---

## 23. Core Stock Update Logic

Implement stock updates transactionally.

```text
BEGIN TRANSACTION

1. Read current inventory item.
2. Validate submitted quantity.
3. previous_quantity = current_stock
4. new_quantity = submitted_actual_quantity
5. quantity_change = new_quantity - previous_quantity
6. Insert stock_records row.
7. Update inventory_items.current_stock.
8. Update inventory_items.updated_by.
9. Update inventory_items.updated_at.

COMMIT
```

If any step fails:

```text
ROLLBACK
```

Never update the item quantity without successfully creating the stock history record.

---

## 24. Core Adjustment Logic

For Addition:

```text
new_quantity = current_stock + quantity
```

For Reduction:

```text
new_quantity = current_stock - quantity
```

Reject reduction when:

```text
new_quantity < 0
```

For Correction:

```text
new_quantity = corrected_quantity
quantity_change = new_quantity - current_stock
```

Every adjustment creates a stock record.

---

## 25. Low Stock Logic

Use:

```text
low_stock = current_stock <= minimum_stock
```

Examples:

```text
Current Stock = 10
Minimum Stock = 5
Status = Normal

Current Stock = 5
Minimum Stock = 5
Status = Low Stock

Current Stock = 3
Minimum Stock = 5
Status = Low Stock
```

Minimum stock values must be configurable because the interview data does not provide exact threshold numbers for each item.

Do not invent threshold values.

---

## 26. Sample Development Data

Create clearly marked sample data only for local development.

Example:

```text
Coffee Beans
Milk
Sugar
Cup
Lid
Syrup
```

Do not present sample quantities as real Ambo Coffee operational data.

Use values such as:

```text
Coffee Beans — 10 kg
Milk — 20 liter
Cup — 100 pcs
```

only if clearly marked as demo/test data.

---

## 27. Security Requirements

- Never store plain-text passwords.
- Protect all authenticated routes.
- Enforce role permissions on the server.
- Validate all input on both client and server.
- Escape/sanitize user-generated text where needed.
- Use prepared statements / safe ORM queries.
- Keep secrets in environment variables.
- Never commit production secrets.
- Use database row-level security if using Supabase.
- Apply least privilege.
- Log security-sensitive failures without exposing them to normal users.

---

## 28. Performance Requirements

This is a small-business system, so prioritize simplicity.

Target behavior:
- Dashboard loads quickly.
- Inventory search responds without noticeable delay for normal UMKM-scale data.
- Stock submission should show confirmation promptly.
- Avoid unnecessary client-side data loading.
- Use pagination if stock history becomes large.

---

## 29. Accessibility

- Use semantic HTML.
- Inputs must have labels.
- Buttons must have meaningful names.
- Ensure sufficient contrast.
- Do not communicate low-stock status with color alone.
- Keyboard navigation should work.
- Form errors should be understandable.

Example:

Use:

```text
Low Stock
```

with an icon/text badge, not only a red color.

---

## 30. Acceptance Criteria

### Authentication
- User can log in with a valid account.
- Invalid credentials show an error.
- Unauthenticated users cannot access protected pages.
- Role restrictions work on server and UI.

### Inventory Item
- Owner/Manager can create an item.
- Owner/Manager can edit an item.
- Staff cannot access item configuration controls.
- An inactive item remains in historical records.

### Stock Recording
- Staff can record actual stock.
- Stock cannot be negative.
- Successful submission creates a Stock Record.
- Successful submission updates Current Stock.
- Previous stock is preserved in history.
- User and timestamp are recorded.

### Low Stock
- Item becomes Low Stock when current stock <= minimum stock.
- Low Stock appears on dashboard.
- Low Stock appears on inventory page.
- Owner/Manager can view the alert list.

### History
- Every stock count and adjustment appears in history.
- History shows previous and new quantity.
- History shows who made the update.
- Regular users cannot delete historical records.

### Reports
- Owner/Manager can filter stock history by date.
- Owner/Manager can filter by item.
- Current inventory status can be viewed as a report.

---

## 31. Testing Requirements

At minimum include tests for:

### Unit / Logic Tests
- Low-stock calculation.
- Addition calculation.
- Reduction calculation.
- Correction calculation.
- Prevention of negative quantity.

### Authorization Tests
- Staff cannot change minimum stock.
- Staff cannot access protected admin actions.
- Owner/Manager can access inventory management.

### Integration Tests
- Stock count creates history and updates inventory.
- Failed history insertion does not update inventory.
- Low-stock status changes correctly after stock update.

### UI / E2E Tests

Critical flow:

```text
Login
→ Record Stock
→ Submit
→ Confirmation
→ Inventory quantity updated
→ Stock history contains new record
→ Low-stock alert appears if threshold reached
```

---

## 32. Seed Users for Development

For local development only, optionally create:

```text
owner@example.com
role: owner

staff@example.com
role: staff
```

Do not use these credentials in production.

Use environment-specific seed scripts.

---

## 33. Implementation Priority

### Phase 1 — Foundation
- Project setup.
- Database.
- Authentication.
- Roles.
- Base layout/navigation.

### Phase 2 — Inventory
- Inventory item CRUD.
- Inventory list.
- Item detail.
- Minimum stock configuration.

### Phase 3 — Stock Recording
- Stock count workflow.
- Stock adjustment workflow.
- Stock history.
- Transaction-safe stock updates.

### Phase 4 — Monitoring
- Dashboard.
- Low-stock alerts.
- Reports.
- Filtering/search.

### Phase 5 — Quality
- Validation.
- Responsive UI.
- Error handling.
- Tests.
- Accessibility.
- Security review.

---

## 34. Codex Implementation Instructions

When implementing this specification:

1. Inspect the existing repository before making changes.
2. Preserve the existing stack if it already satisfies the requirements.
3. Do not rewrite unrelated code.
4. Build the smallest coherent implementation that satisfies the specification.
5. Prefer simple architecture over unnecessary abstraction.
6. Keep UI components reusable but not over-engineered.
7. Use migrations for database changes.
8. Add seed/demo data separately from production data.
9. Do not fabricate real Ambo Coffee inventory quantities.
10. Do not implement POS integration.
11. Do not automatically deduct stock from sales because the proposed system currently relies on manual physical stock counting.
12. Use configurable minimum stock thresholds.
13. Preserve stock history as an audit trail.
14. Implement role checks on the server.
15. Add a README section explaining local setup.
16. Add `.env.example` for required environment variables.
17. Run lint, type checking, and tests before considering the task complete.
18. Report any assumption that was necessary because this specification did not define it.
19. Do not silently expand project scope.
20. Prefer Indonesian labels in the end-user interface unless the repository already defines another language standard.

---

## 35. Suggested Indonesian UI Labels

Navigation:

```text
Dashboard
Persediaan
Catat Stok
Penyesuaian Stok
Riwayat Stok
Peringatan Stok
Laporan
Pengaturan
Keluar
```

Common actions:

```text
Tambah Item
Simpan
Batal
Edit
Nonaktifkan
Cari
Filter
Lihat Detail
Catat Stok
```

Stock statuses:

```text
Normal
Stok Menipis
Tidak Aktif
```

Messages:

```text
Data stok berhasil disimpan.
Item berhasil ditambahkan.
Item berhasil diperbarui.
Jumlah stok tidak boleh negatif.
Data belum lengkap.
Terjadi kesalahan. Silakan coba kembali.
```

---

## 36. Non-Functional Requirements

### Usability
- Simple enough for daily use by coffee shop staff.
- Main stock workflow should require as few steps as practical.
- Mobile-friendly.

### Reliability
- Stock updates and stock history must remain consistent.
- Use database transactions for inventory-changing operations.

### Security
- Role-based authorization.
- Secure authentication.
- Input validation.
- Protected database operations.

### Maintainability
- Clear file structure.
- Clear naming.
- Small reusable components.
- Database migrations.
- Minimal technical debt.

### Scalability
The initial design only needs to support one small coffee shop operation, but avoid hardcoding behavior that would prevent moderate growth in inventory items or stock-history records.

---

## 37. Final Deliverable Expected from Codex

The completed project should contain:

- Working web application.
- Authentication.
- Staff and Owner/Manager roles.
- Inventory item management.
- Stock count workflow.
- Stock adjustment.
- Stock history.
- Current stock dashboard.
- Low-stock alerts.
- Reports.
- Responsive layout.
- Database schema and migrations.
- Seed/demo data.
- Validation.
- Error handling.
- Tests for critical business logic.
- `.env.example`.
- Updated README with setup and run instructions.

The finished application must remain aligned with the core system purpose:

> **Helping Ambo Coffee record, store, monitor, and review inventory stock in a more structured way than the previous manual stock-recording process.**
