-- ---------------------------------------------------------------------------
-- Seed data — demo accounts for every role so you can log in immediately.
-- Passwords are hashed here using pgcrypto's bcrypt (compatible with the
-- bcryptjs library used in the Node backend).
--
-- Run with:  psql -U <user> -d mhc_db -f db/seed.sql
-- (or: npm run db:setup, which runs schema.sql + seed.sql together)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Login convention used by the frontend (see ROLE_CONFIG in constants/index.js):
--   Student/Faculty/Staff -> identifier = reg no / official email, password = DOB (DD-MM-YYYY)
--   Counsellor/Admin/Dean -> identifier = official email,          password = DOB (DD-MM-YYYY)

INSERT INTO users (identifier, name, email, user_type, branch, password_hash) VALUES
  ('20BCS001', 'Aarav Sharma', '20bcs001@mnnit.ac.in', 'student', 'Computer Science',
    crypt('15-05-2002', gen_salt('bf'))),

  ('faculty.demo@mnnit.ac.in', 'Dr. Ravi Verma', 'faculty.demo@mnnit.ac.in', 'faculty', NULL,
    crypt('01-01-1980', gen_salt('bf'))),

  ('staff.demo@mnnit.ac.in', 'Sunita Devi', 'staff.demo@mnnit.ac.in', 'staff', NULL,
    crypt('20-08-1985', gen_salt('bf'))),

  ('counsellor@mnnit.ac.in', 'Dr. Kamlesh Kumar', 'counsellor@mnnit.ac.in', 'counsellor', NULL,
    crypt('10-03-1975', gen_salt('bf'))),

  ('admin@mnnit.ac.in', 'Admin User', 'admin@mnnit.ac.in', 'administrator', NULL,
    crypt('05-05-1978', gen_salt('bf'))),

  ('dean@mnnit.ac.in', 'Prof. Neeraj Tyagi', 'dean@mnnit.ac.in', 'dean', NULL,
    crypt('12-12-1970', gen_salt('bf')));

-- A couple of sample appointments so the dashboards aren't empty on first run.
INSERT INTO appointments (booker_id, counsellor_id, appointment_date, time_slot, description, status)
SELECT u.id, c.id, CURRENT_DATE + 2, '10:00 AM', 'Feeling stressed about upcoming exams.', 'PENDING'
FROM users u, users c
WHERE u.identifier = '20BCS001' AND c.identifier = 'counsellor@mnnit.ac.in';

INSERT INTO appointments (booker_id, counsellor_id, appointment_date, time_slot, description, status, action_performed, resolution)
SELECT u.id, c.id, CURRENT_DATE - 5, '02:00 PM', 'Sleep issues.', 'COMPLETED', 'Discussed sleep hygiene techniques.', 'RESOLVED'
FROM users u, users c
WHERE u.identifier = '20BCS001' AND c.identifier = 'counsellor@mnnit.ac.in';

-- Sample public content (optional Phase 2 tables)
INSERT INTO team_members (category, name, role, email, phone, qualification, expertise) VALUES
  ('Deans', 'Prof. Neeraj Tyagi', 'Academic Affairs', 'headadmin@mnnit.ac.in', '+91-512-2259-101', 'Ph.D. in Administration', 'Oversees administration, policy, and partnerships.'),
  ('Counsellors', 'Dr. Kamlesh Kumar', 'Professional Counsellor / Psychologist', 'counsellor@mnnit.ac.in', '+91-512-2259-200', 'M.Phil Clinical Psychology', 'Individual counselling and crisis support.');

INSERT INTO emergency_contacts (category, label, name, role, office, department, phone, email, is_danger) VALUES
  ('heads', 'CMHW Heads', 'Prof. Neeraj Tyagi', 'Head-Admin', 'Dean Office', NULL, '+91-512-2259-101', 'headadmin@mnnit.ac.in', false),
  ('rows', NULL, NULL, NULL, NULL, 'Health Centre (Ambulance)', '+91-512-2259-911', NULL, true);
