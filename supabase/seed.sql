-- Tables seed
INSERT INTO restaurant_tables (id, label, shape, capacity_min, capacity_max, is_combo_critical, is_combinable, position_x, position_y, width, height) VALUES
(1, '1', 'regular', 1, 4, false, true, 100, 500, 80, 80),
(2, '2', 'regular', 1, 4, false, true, 200, 500, 80, 80),
(3, '3', 'regular', 1, 4, false, true, 300, 500, 80, 80),
(4, '4', 'round', 5, 7, false, false, 200, 300, 100, 100),
(5, '5', 'regular', 1, 4, false, false, 300, 300, 80, 80),
(6, '6', 'round', 5, 7, false, false, 400, 300, 100, 100),
(7, '7', 'regular', 1, 4, false, true, 50, 100, 80, 80),
(8, '8', 'regular', 1, 4, false, true, 50, 200, 80, 80),
(9, '9', 'large', 6, 12, false, true, 50, 300, 120, 80),
(10, '10', 'regular', 1, 4, true, true, 250, 50, 80, 80),
(11, '11', 'large', 8, 14, false, true, 400, 50, 120, 80),
(12, '12', 'regular', 1, 4, true, true, 550, 50, 80, 80),
(13, '13', 'large', 6, 12, false, true, 700, 50, 120, 80),
(14, '14', 'regular', 1, 4, false, true, 850, 50, 80, 80);

-- Valid Combos seed
-- Capacities for combos are calculated as the sum of capacity_max of individual tables, 
-- and min_capacity is usually the sum of capacity_min OR slightly adjusted for efficiency.
-- I will use sum of min and sum of max for simplicity unless specified.
INSERT INTO table_combos (table_ids, min_capacity, max_capacity) VALUES
('{1,2}', 2, 8),
('{2,3}', 2, 8),
('{1,2,3}', 3, 12),
('{7,8}', 2, 8),
('{8,9}', 7, 16),
('{7,8,9}', 8, 20),
('{9,10}', 7, 16),
('{10,11}', 9, 18),
('{9,10,11}', 15, 30),
('{11,12}', 9, 18),
('{12,13}', 7, 16),
('{11,12,13}', 15, 30),
('{13,14}', 7, 16),
('{9,10,11,12}', 16, 34),
('{10,11,12,13}', 16, 34),
('{9,10,11,12,13}', 22, 46),
('{7,8,9,10,11}', 17, 38),
('{7,8,9,10,11,12,13}', 24, 52),
('{7,8,9,10,11,12,13,14}', 25, 56);
