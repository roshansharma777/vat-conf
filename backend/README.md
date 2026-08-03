# VAT Billing System Database Setup

## SQLite setup

This backend uses SQLite by default.
The database file will be created automatically as `backend/database.sqlite` when the server starts.

If you want to manually initialize the database, run the SQL file using a SQLite client such as `sqlite3`:

```bash
sqlite3 backend/database.sqlite < backend/init.sql
```

## Default login

- Email: admin@vat.com
- Password: admin123
