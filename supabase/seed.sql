-- Kotatsu seed data
-- day_of_week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun

INSERT INTO tasks (label, frequency, time_of_day, day_of_week, category, group_name, sort_order) VALUES

-- ─────────────────────────────────────────────────────────────
-- DAILY — MORNING
-- ─────────────────────────────────────────────────────────────
('Make bed',                'daily', 'morning', NULL, 'Cleaning', 'Bedroom & Bath', 1),
('Wipe bathroom counters',  'daily', 'morning', NULL, 'Cleaning', 'Bedroom & Bath', 2),
('Load / unload dishwasher','daily', 'morning', NULL, 'Cleaning', 'Kitchen',         1),

-- ─────────────────────────────────────────────────────────────
-- DAILY — EVENING
-- ─────────────────────────────────────────────────────────────
('Clean kitchen counters',          'daily', 'evening', NULL, 'Cleaning', 'Kitchen',        1),
('Sweep kitchen floor',             'daily', 'evening', NULL, 'Cleaning', 'Kitchen',        2),
('5-min reset — put things back',   'daily', 'evening', NULL, 'Cleaning', 'Evening Reset',  1),
('Take out trash if needed',        'daily', 'evening', NULL, 'Cleaning', 'Evening Reset',  2),

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Monday: Bathroom
-- ─────────────────────────────────────────────────────────────
('Clean toilet, sink & mirror', 'weekly', NULL, 1, 'Cleaning', 'Bathroom', 1),
('Scrub shower / tub',          'weekly', NULL, 1, 'Cleaning', 'Bathroom', 2),
('Replace towels',              'weekly', NULL, 1, 'Cleaning', 'Bathroom', 3),

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Tuesday: Bedroom
-- ─────────────────────────────────────────────────────────────
('Change bed sheets',          'weekly', NULL, 2, 'Cleaning', 'Bedroom', 1),
('Dust surfaces',              'weekly', NULL, 2, 'Cleaning', 'Bedroom', 2),
('Vacuum bedroom floors',      'weekly', NULL, 2, 'Cleaning', 'Bedroom', 3),
('Declutter nightstands',      'weekly', NULL, 2, 'Cleaning', 'Bedroom', 4),

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Wednesday: Kitchen
-- ─────────────────────────────────────────────────────────────
('Wipe appliances',    'weekly', NULL, 3, 'Cleaning', 'Kitchen (Wed)', 1),
('Clean sink',         'weekly', NULL, 3, 'Cleaning', 'Kitchen (Wed)', 2),
('Mop kitchen floor',  'weekly', NULL, 3, 'Cleaning', 'Kitchen (Wed)', 3),

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Thursday: Living Areas
-- ─────────────────────────────────────────────────────────────
('Dust furniture, TV & shelves',              'weekly', NULL, 4, 'Cleaning', 'Living Areas', 1),
('Vacuum rugs / sweep floors',                'weekly', NULL, 4, 'Cleaning', 'Living Areas', 2),
('Wipe high-touch surfaces (switches, remote)','weekly', NULL, 4, 'Cleaning', 'Living Areas', 3),

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Friday: Floors
-- ─────────────────────────────────────────────────────────────
('Vacuum & sweep whole house', 'weekly', NULL, 5, 'Cleaning', 'Floors', 1),
('Mop all hardwood',           'weekly', NULL, 5, 'Cleaning', 'Floors', 2),

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Saturday: Laundry & Reset
-- ─────────────────────────────────────────────────────────────
('Catch up on laundry',                          'weekly', NULL, 6, 'Cleaning', 'Laundry & Reset', 1),
('Organize clutter hotspots (entryway, tables)', 'weekly', NULL, 6, 'Cleaning', 'Laundry & Reset', 2),

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Sunday: Light Day
-- ─────────────────────────────────────────────────────────────
('Dishes & quick tidy',           'weekly', NULL, 7, 'Cleaning',  'Sunday', 1),
('Aquarium water change',         'weekly', NULL, 7, 'Aquarium',  'Sunday', 2),

-- ─────────────────────────────────────────────────────────────
-- MONTHLY
-- ─────────────────────────────────────────────────────────────
('Clean inside refrigerator',    'monthly', NULL, NULL, 'Cleaning', 'Monthly Deep Clean', 1),
('Dust ceiling vents',           'monthly', NULL, NULL, 'Cleaning', 'Monthly Deep Clean', 2),
('Wash baseboards & doors',      'monthly', NULL, NULL, 'Cleaning', 'Monthly Deep Clean', 3),
('Vacuum under furniture',       'monthly', NULL, NULL, 'Cleaning', 'Monthly Deep Clean', 4),
('Clean windows & mirrors',      'monthly', NULL, NULL, 'Cleaning', 'Monthly Deep Clean', 5),
('Clean inside microwave & oven','monthly', NULL, NULL, 'Cleaning', 'Monthly Deep Clean', 6),
('Clean the espresso machine',   'monthly', NULL, NULL, 'Cleaning', 'Monthly Deep Clean', 7),

-- ─────────────────────────────────────────────────────────────
-- QUARTERLY
-- ─────────────────────────────────────────────────────────────
('Rotate mattresses',           'quarterly', NULL, NULL, 'Cleaning', 'Seasonal', 1),
('Wash curtains',               'quarterly', NULL, NULL, 'Cleaning', 'Seasonal', 2),
('Deep clean carpets & rugs',   'quarterly', NULL, NULL, 'Cleaning', 'Seasonal', 3),
('Clean garage & storage areas','quarterly', NULL, NULL, 'Cleaning', 'Seasonal', 4),
('Replace furnace filters',     'quarterly', NULL, NULL, 'Cleaning', 'Seasonal', 5);
