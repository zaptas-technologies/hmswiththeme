## HMS Backend (Express + MongoDB)

Professional backend API with explicit Mongoose schemas for all datasets from `src/core/json`. Each resource has a properly defined schema with validation, enums, and type safety.

### Features

- ✅ **47+ Explicit Schemas** - Every dataset has a proper Mongoose schema with field types, validation, and enums
- ✅ **Type Safety** - Schemas enforce data structure and validation rules
- ✅ **Flexible Fields** - All schemas use `strict: false` to allow additional fields from theme data
- ✅ **Auto Resource Mapping** - Resources are automatically mapped from filenames to schemas
- ✅ **Full CRUD** - Complete REST API with pagination, filtering, and sorting

### Quick start

1. `cd backend`
2. `cp .env.example .env` and set `MONGODB_URI` (e.g., `mongodb://localhost:27017/hms-theme`)
3. `npm install`
4. Seed theme data into Mongo: `npm run seed` (loads all 47+ datasets)
5. Start API: `npm run dev` (or `npm run start` after `npm run build`)

### Seed Dummy Data for Reports

To populate the database with realistic dummy data for testing reports:

```bash
npm run seed-dummy-data
```

This script creates:
- 1 Superadmin user
- 1 Hospital with Hospital Admin user
- 10 Doctors (with user accounts)
- 25 Patients
- 25 Appointments (with various statuses)
- 15 Consultations (for completed appointments)
- Multiple Prescriptions (linked to consultations)

**Login Credentials:**
- Superadmin: `superadmin@preclinic.com` / `123456`
- Hospital Admin: `hospitaladmin@preclinic.com` / `123456`
- Doctors: `<doctor-email>` / `123456`

### API Endpoints

- `GET /api` — list all available resources
- `GET /api/:resource` — paginated list with query params:
  - `page` - page number (default: 1)
  - `limit` - items per page (default: 10)
  - `sort` - sort field (default: createdAt)
- `GET /api/:resource/:id` — fetch single record by `_id` or original `id` field
- `POST /api/:resource` — create new record
- `PATCH /api/:resource/:id` — update existing record
- `DELETE /api/:resource/:id` — delete record

### Available Resources

All resources from `src/core/json` are available, including:
- `announcements`, `appointments`, `doctors`, `patients`
- `assets`, `invoices`, `transactions`, `expenses`, `income`
- `staffs`, `leaves`, `services`, `specializations`
- `countries`, `cities`, `states`, `locations`
- `payments`, `payroll`, `tickets`, `testimonials`
- `blogcategories`, `blogcomments`, `newsletters`
- And many more...

### Schema Structure

Each resource has an explicit schema defined in `src/models/schemas/*.ts` with:
- Required fields marked with `required: true`
- Enum validation for status fields
- Unique constraints on ID fields
- Timestamps automatically added
- Flexible mode (`strict: false`) to accept additional fields

### Example Usage

```bash
# Get all appointments
curl http://localhost:4000/api/appointments

# Get appointments with pagination
curl http://localhost:4000/api/appointments?page=1&limit=20&sort=Date_Time

# Get single appointment
curl http://localhost:4000/api/appointments/1

# Create new appointment
curl -X POST http://localhost:4000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"id":"11","Date_Time":"01 May 2026- 10:00 AM","Patient":"John Doe",...}'

# Update appointment
curl -X PATCH http://localhost:4000/api/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{"Status":"Confirmed"}'

# Delete appointment
curl -X DELETE http://localhost:4000/api/appointments/1
```
