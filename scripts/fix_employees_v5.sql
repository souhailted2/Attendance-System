-- =====================================================
-- SQL v5: دمج الـ ghosts فقط (employee_code = USERID ولكن ليس Badgenumber)
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- GHOST: code='3' → يجب دمجه مع employee '82'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '3' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '82' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '82' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='5' → يجب دمجه مع employee '27'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '5' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '27' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '27' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='23' → يجب دمجه مع employee '212'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '23' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '212' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '212' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='33' → يجب دمجه مع employee '6'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '33' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '6' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '6' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='34' → يجب دمجه مع employee '7'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '34' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '7' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '7' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='111' → يجب دمجه مع employee '115'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '111' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '115' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '115' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='123' → يجب دمجه مع employee '142'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '123' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '142' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '142' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='167' → يجب دمجه مع employee '211'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '167' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '211' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '211' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='175' → يجب دمجه مع employee '227'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '175' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '227' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '227' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='189' → يجب دمجه مع employee '250'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '189' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '250' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '250' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='193' → يجب دمجه مع employee '255'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '193' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '255' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '255' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='260' → يجب دمجه مع employee '371'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '260' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '371' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '371' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='264' → يجب دمجه مع employee '378'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '264' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '378' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '378' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='283' → يجب دمجه مع employee '412'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '283' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '412' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '412' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='293' → يجب دمجه مع employee '424'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '293' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '424' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '424' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='304' → يجب دمجه مع employee '454'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '304' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '454' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '454' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='327' → يجب دمجه مع employee '226'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '327' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '226' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '226' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='342' → يجب دمجه مع employee '77'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '342' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '77' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '77' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='360' → يجب دمجه مع employee '459'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '360' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '459' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '459' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='363' → يجب دمجه مع employee '291'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '363' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '291' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '291' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='364' → يجب دمجه مع employee '17'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '364' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '17' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '17' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='377' → يجب دمجه مع employee '89'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '377' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '89' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '89' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='391' → يجب دمجه مع employee '400'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '391' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '400' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '400' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='392' → يجب دمجه مع employee '452'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '392' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '452' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '452' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='432' → يجب دمجه مع employee '466'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '432' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '466' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '466' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='435' → يجب دمجه مع employee '390'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '435' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '390' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '390' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='441' → يجب دمجه مع employee '320'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '441' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '320' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '320' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='442' → يجب دمجه مع employee '429'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '442' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '429' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '429' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- GHOST: code='444' → يجب دمجه مع employee '475'
SET @old_id = (SELECT id FROM employees WHERE employee_code = '444' LIMIT 1);
SET @new_id = (SELECT id FROM employees WHERE employee_code = '475' LIMIT 1);
DELETE FROM attendance_records WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL
  AND `date` IN (SELECT `date` FROM (SELECT `date` FROM attendance_records WHERE employee_id = @new_id) AS tmp);
UPDATE attendance_records SET employee_id = @new_id WHERE employee_id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
DELETE FROM employees WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NOT NULL;
UPDATE employees SET employee_code = '475' WHERE id = @old_id AND @old_id IS NOT NULL AND @new_id IS NULL;

-- ===== الخطوة 2: تحديث الأسماء من Excel =====

UPDATE employees SET name = 'بوقطاية عز الدين' WHERE employee_code = '1';
UPDATE employees SET name = 'مدلل طارق' WHERE employee_code = '2';
UPDATE employees SET name = 'مسعي محمد البشير' WHERE employee_code = '4';
UPDATE employees SET name = 'بوقطاية محمد انور' WHERE employee_code = '6';
UPDATE employees SET name = 'دهيمي عمار' WHERE employee_code = '7';
UPDATE employees SET name = 'احميد راتب' WHERE employee_code = '8';
UPDATE employees SET name = 'شبرو عبد الرحمن' WHERE employee_code = '10';
UPDATE employees SET name = 'خليل عبد الحميد' WHERE employee_code = '11';
UPDATE employees SET name = 'العقوبي رمزي' WHERE employee_code = '12';
UPDATE employees SET name = 'قابوسة علي' WHERE employee_code = '13';
UPDATE employees SET name = 'حابي اميرة' WHERE employee_code = '15';
UPDATE employees SET name = 'ساحة علي' WHERE employee_code = '18';
UPDATE employees SET name = 'بن سعدية السعيد' WHERE employee_code = '20';
UPDATE employees SET name = 'صبتي محمود التجاني' WHERE employee_code = '21';
UPDATE employees SET name = 'نويوات شويطر سفيان' WHERE employee_code = '22';
UPDATE employees SET name = 'هقي العروسي' WHERE employee_code = '24';
UPDATE employees SET name = 'شيخة يمينة' WHERE employee_code = '25';
UPDATE employees SET name = 'بن حوة عبد القادر' WHERE employee_code = '26';
UPDATE employees SET name = 'مدخل هدى' WHERE employee_code = '27';
UPDATE employees SET name = 'سالم الياس' WHERE employee_code = '28';
UPDATE employees SET name = 'جاب الله العربي' WHERE employee_code = '30';
UPDATE employees SET name = 'لموشي يوسف' WHERE employee_code = '31';
UPDATE employees SET name = 'بن عبد الله المولدي' WHERE employee_code = '32';
UPDATE employees SET name = 'بلهادف عبد الرحمن' WHERE employee_code = '35';
UPDATE employees SET name = 'شريف احمد' WHERE employee_code = '36';
UPDATE employees SET name = 'دهيمي مختار' WHERE employee_code = '37';
UPDATE employees SET name = 'تجاني محمد الطاهر' WHERE employee_code = '38';
UPDATE employees SET name = 'معوش الصادق' WHERE employee_code = '39';
UPDATE employees SET name = 'تجيني نور الدين' WHERE employee_code = '40';
UPDATE employees SET name = 'جلاب السعيد' WHERE employee_code = '41';
UPDATE employees SET name = 'احميد نعيم' WHERE employee_code = '43';
UPDATE employees SET name = 'غريسي ايوب' WHERE employee_code = '44';
UPDATE employees SET name = 'شوية حمد' WHERE employee_code = '45';
UPDATE employees SET name = 'كبسة عائشة' WHERE employee_code = '46';
UPDATE employees SET name = 'تريكي مسعود' WHERE employee_code = '47';
UPDATE employees SET name = 'عياشي محمد' WHERE employee_code = '48';
UPDATE employees SET name = 'طويل عبد الغني' WHERE employee_code = '49';
UPDATE employees SET name = 'ممادي العيد' WHERE employee_code = '51';
UPDATE employees SET name = 'عيساوي حمزة' WHERE employee_code = '52';
UPDATE employees SET name = 'فليون عبد القادر' WHERE employee_code = '53';
UPDATE employees SET name = 'طواهرية الياس' WHERE employee_code = '54';
UPDATE employees SET name = 'بوته سندس' WHERE employee_code = '55';
UPDATE employees SET name = 'شلبي يوسف' WHERE employee_code = '57';
UPDATE employees SET name = 'بشيري علي' WHERE employee_code = '58';
UPDATE employees SET name = 'تجيني عنتر' WHERE employee_code = '59';
UPDATE employees SET name = 'عطية سعد' WHERE employee_code = '60';
UPDATE employees SET name = 'جاب الله الحاج علي' WHERE employee_code = '61';
UPDATE employees SET name = 'بكوش سعد' WHERE employee_code = '62';
UPDATE employees SET name = 'ممادي بشير' WHERE employee_code = '63';
UPDATE employees SET name = 'مدخل نعيمة' WHERE employee_code = '64';
UPDATE employees SET name = 'سعداني احمد' WHERE employee_code = '65';
UPDATE employees SET name = 'قدور عبد الباسط' WHERE employee_code = '67';
UPDATE employees SET name = 'سعيد سعد' WHERE employee_code = '68';
UPDATE employees SET name = 'شيخة مبروك خميس' WHERE employee_code = '69';
UPDATE employees SET name = 'سبوعي علي شوقي' WHERE employee_code = '70';
UPDATE employees SET name = 'عبيدي اسامة' WHERE employee_code = '71';
UPDATE employees SET name = 'بن يامة ابراهيم' WHERE employee_code = '72';
UPDATE employees SET name = 'حريز بكار المهدي' WHERE employee_code = '73';
UPDATE employees SET name = 'حشيفة محمد' WHERE employee_code = '74';
UPDATE employees SET name = 'عتيق محمد' WHERE employee_code = '75';
UPDATE employees SET name = 'عاد احمد' WHERE employee_code = '76';
UPDATE employees SET name = 'مناعي التجاني' WHERE employee_code = '78';
UPDATE employees SET name = 'موم مسعودة' WHERE employee_code = '79';
UPDATE employees SET name = 'موم حليمة' WHERE employee_code = '81';
UPDATE employees SET name = 'حبيب الزهرة' WHERE employee_code = '82';
UPDATE employees SET name = 'وصيف تواتي وجدان' WHERE employee_code = '83';
UPDATE employees SET name = 'عتير السعيد' WHERE employee_code = '86';
UPDATE employees SET name = 'بالي عبد الرزاق' WHERE employee_code = '87';
UPDATE employees SET name = 'العابد عبد الوهاب' WHERE employee_code = '88';
UPDATE employees SET name = 'وقادي السعيد' WHERE employee_code = '91';
UPDATE employees SET name = 'غريسي عبد الله' WHERE employee_code = '92';
UPDATE employees SET name = 'طنش الطاهر' WHERE employee_code = '93';
UPDATE employees SET name = 'زان دلال' WHERE employee_code = '94';
UPDATE employees SET name = 'فاضل عبد الحميد' WHERE employee_code = '95';
UPDATE employees SET name = 'سوداني جمال' WHERE employee_code = '96';
UPDATE employees SET name = 'جراية رزقي' WHERE employee_code = '97';
UPDATE employees SET name = 'بن حوى اسماعيل' WHERE employee_code = '98';
UPDATE employees SET name = 'سويسي احمد' WHERE employee_code = '99';
UPDATE employees SET name = 'زبيدي علي' WHERE employee_code = '100';
UPDATE employees SET name = 'غربي جمال' WHERE employee_code = '101';
UPDATE employees SET name = 'نصري زيد' WHERE employee_code = '103';
UPDATE employees SET name = 'زغيب توفيق' WHERE employee_code = '104';
UPDATE employees SET name = 'بزايدية امير' WHERE employee_code = '105';
UPDATE employees SET name = 'احميد احمد التجاني' WHERE employee_code = '107';
UPDATE employees SET name = 'ميموني حسين' WHERE employee_code = '108';
UPDATE employees SET name = 'حماني العروسي' WHERE employee_code = '109';
UPDATE employees SET name = 'ميداوي ابتسام' WHERE employee_code = '110';
UPDATE employees SET name = 'ديدة رمزي' WHERE employee_code = '112';
UPDATE employees SET name = 'مومن مسعود البشير' WHERE employee_code = '113';
UPDATE employees SET name = 'مسعي محمد ابراهيم' WHERE employee_code = '115';
UPDATE employees SET name = 'مناني حمزة' WHERE employee_code = '117';
UPDATE employees SET name = 'محبوبي عبد العزيز' WHERE employee_code = '118';
UPDATE employees SET name = 'العاتي بن سالم' WHERE employee_code = '119';
UPDATE employees SET name = 'بيكي وردة' WHERE employee_code = '121';
UPDATE employees SET name = 'عبيدي سعد نصيرة' WHERE employee_code = '122';
UPDATE employees SET name = 'بلال عائشة' WHERE employee_code = '124';
UPDATE employees SET name = 'ساحة العربي' WHERE employee_code = '125';
UPDATE employees SET name = 'مداوي جمعة' WHERE employee_code = '126';
UPDATE employees SET name = 'حومدي اياس' WHERE employee_code = '128';
UPDATE employees SET name = 'كشحة عبد الفتاح' WHERE employee_code = '129';
UPDATE employees SET name = 'ربوح سامية' WHERE employee_code = '130';
UPDATE employees SET name = 'عطر آمنة' WHERE employee_code = '132';
UPDATE employees SET name = 'بن علية شكري' WHERE employee_code = '133';
UPDATE employees SET name = 'تليلي الهادي' WHERE employee_code = '134';
UPDATE employees SET name = 'حميد الوليد' WHERE employee_code = '135';
UPDATE employees SET name = 'شرفي عبد النور' WHERE employee_code = '137';
UPDATE employees SET name = 'حتيري سليمة' WHERE employee_code = '138';
UPDATE employees SET name = 'حبيب عبد الرزاق' WHERE employee_code = '139';
UPDATE employees SET name = 'بن عيشة محمد' WHERE employee_code = '142';
UPDATE employees SET name = 'بن احمد يونس' WHERE employee_code = '143';
UPDATE employees SET name = 'صوالح احميمة سعد' WHERE employee_code = '144';
UPDATE employees SET name = 'طواهرية علي' WHERE employee_code = '145';
UPDATE employees SET name = 'حمو العيد' WHERE employee_code = '147';
UPDATE employees SET name = 'مراد عبد القادر' WHERE employee_code = '148';
UPDATE employees SET name = 'فرحات عبد الجبار' WHERE employee_code = '151';
UPDATE employees SET name = 'بن احمد عمر' WHERE employee_code = '152';
UPDATE employees SET name = 'فرحات ربيع' WHERE employee_code = '154';
UPDATE employees SET name = 'عياشي عمر عبد الفتاح' WHERE employee_code = '156';
UPDATE employees SET name = 'ربيعي محمد' WHERE employee_code = '158';
UPDATE employees SET name = 'ممادي محمد الحبيب' WHERE employee_code = '159';
UPDATE employees SET name = 'سعيد محمد العربي' WHERE employee_code = '162';
UPDATE employees SET name = 'حمدي الياس' WHERE employee_code = '163';
UPDATE employees SET name = 'شمسة محمد' WHERE employee_code = '164';
UPDATE employees SET name = 'بوترعة احمد' WHERE employee_code = '165';
UPDATE employees SET name = 'قريرة عبد العزيز' WHERE employee_code = '166';
UPDATE employees SET name = 'مكاوي نور الدين' WHERE employee_code = '168';
UPDATE employees SET name = 'زيدي رشيد' WHERE employee_code = '169';
UPDATE employees SET name = 'مكاوي احمد شوقي' WHERE employee_code = '170';
UPDATE employees SET name = 'طالبي محمد الصادق' WHERE employee_code = '171';
UPDATE employees SET name = 'قبنة عبد الرحمن' WHERE employee_code = '172';
UPDATE employees SET name = 'مذكور عبد المجيد' WHERE employee_code = '178';
UPDATE employees SET name = 'عبد القوي عمار' WHERE employee_code = '179';
UPDATE employees SET name = 'ياحي السعيد' WHERE employee_code = '180';
UPDATE employees SET name = 'عيساوي احمد البخاري' WHERE employee_code = '182';
UPDATE employees SET name = 'هنيات المولدي' WHERE employee_code = '183';
UPDATE employees SET name = 'واده ربح' WHERE employee_code = '184';
UPDATE employees SET name = 'حنكة علي' WHERE employee_code = '185';
UPDATE employees SET name = 'نسيب عرفات' WHERE employee_code = '186';
UPDATE employees SET name = 'عروة سمراء' WHERE employee_code = '188';
UPDATE employees SET name = 'رقيق ايناس' WHERE employee_code = '190';
UPDATE employees SET name = 'ربيعي سالم' WHERE employee_code = '191';
UPDATE employees SET name = 'حمصي مسعود' WHERE employee_code = '192';
UPDATE employees SET name = 'منصر انور' WHERE employee_code = '194';
UPDATE employees SET name = 'سلمان لمين' WHERE employee_code = '195';
UPDATE employees SET name = 'مسعي محمد علي 2' WHERE employee_code = '197';
UPDATE employees SET name = 'وادة مريم' WHERE employee_code = '198';
UPDATE employees SET name = 'جرادي حمزة' WHERE employee_code = '199';
UPDATE employees SET name = 'قدور فظيل' WHERE employee_code = '200';
UPDATE employees SET name = 'مسعي محمد السعيد' WHERE employee_code = '201';
UPDATE employees SET name = 'ديدة وليد' WHERE employee_code = '202';
UPDATE employees SET name = 'طواهر محمود' WHERE employee_code = '203';
UPDATE employees SET name = 'احويج فارس' WHERE employee_code = '204';
UPDATE employees SET name = 'حمصي هشام' WHERE employee_code = '206';
UPDATE employees SET name = 'غانم نبيل' WHERE employee_code = '207';
UPDATE employees SET name = 'عطية صالح' WHERE employee_code = '208';
UPDATE employees SET name = 'سلامة احمد البشير' WHERE employee_code = '209';
UPDATE employees SET name = 'نصبة ابراهيم' WHERE employee_code = '210';
UPDATE employees SET name = 'حمدي ايمن' WHERE employee_code = '211';
UPDATE employees SET name = 'شريفي حسن' WHERE employee_code = '212';
UPDATE employees SET name = 'جويدة احمد فوزي' WHERE employee_code = '213';
UPDATE employees SET name = 'لعوج حسن' WHERE employee_code = '214';
UPDATE employees SET name = 'بهى خليفة' WHERE employee_code = '215';
UPDATE employees SET name = 'زغدي محمد الصالح' WHERE employee_code = '216';
UPDATE employees SET name = 'خناب محمد الصالح' WHERE employee_code = '217';
UPDATE employees SET name = 'بن عون اسامة' WHERE employee_code = '218';
UPDATE employees SET name = 'قديري عبد الرحمن' WHERE employee_code = '219';
UPDATE employees SET name = 'عبيد بوبكر' WHERE employee_code = '220';
UPDATE employees SET name = 'قرميط عبد الرؤوف' WHERE employee_code = '221';
UPDATE employees SET name = 'تامة احمد البشير' WHERE employee_code = '222';
UPDATE employees SET name = 'غالية الياس' WHERE employee_code = '223';
UPDATE employees SET name = 'فارس مراد' WHERE employee_code = '224';
UPDATE employees SET name = 'دبش عمار' WHERE employee_code = '227';
UPDATE employees SET name = 'رقيق ابتسام' WHERE employee_code = '228';
UPDATE employees SET name = 'سلمي احمد' WHERE employee_code = '229';
UPDATE employees SET name = 'حبيب بلقاسم' WHERE employee_code = '232';
UPDATE employees SET name = 'قرفي اسحاق' WHERE employee_code = '234';
UPDATE employees SET name = 'عامر عبد المنعم' WHERE employee_code = '236';
UPDATE employees SET name = 'وذيني بلال' WHERE employee_code = '237';
UPDATE employees SET name = 'حميد حمزة' WHERE employee_code = '239';
UPDATE employees SET name = 'بن بردي مسعود' WHERE employee_code = '242';
UPDATE employees SET name = 'سباق عبد القادر بوبكر' WHERE employee_code = '243';
UPDATE employees SET name = 'زروق عبد الرزاق' WHERE employee_code = '245';
UPDATE employees SET name = 'زبيدي جعفر' WHERE employee_code = '246';
UPDATE employees SET name = 'جرو الزهرة' WHERE employee_code = '247';
UPDATE employees SET name = 'غريسي زكرياء' WHERE employee_code = '248';
UPDATE employees SET name = 'عمامرة عبد السلام' WHERE employee_code = '249';
UPDATE employees SET name = 'بهى محسن' WHERE employee_code = '250';
UPDATE employees SET name = 'بن عمر عماد الدين' WHERE employee_code = '251';
UPDATE employees SET name = 'فاضل صدام' WHERE employee_code = '253';
UPDATE employees SET name = 'مشري خالد' WHERE employee_code = '254';
UPDATE employees SET name = 'شيحاني محمد الامين' WHERE employee_code = '255';
UPDATE employees SET name = 'سقني عقبة' WHERE employee_code = '258';
UPDATE employees SET name = 'سمينة جمعة' WHERE employee_code = '261';
UPDATE employees SET name = 'عتيق نصر سليم' WHERE employee_code = '262';
UPDATE employees SET name = 'لشهب بوبكر' WHERE employee_code = '263';
UPDATE employees SET name = 'حقيق لطفي' WHERE employee_code = '265';
UPDATE employees SET name = 'زواري احمد مريم' WHERE employee_code = '266';
UPDATE employees SET name = 'دشري الحاج علي' WHERE employee_code = '267';
UPDATE employees SET name = 'غدير عمر امجد' WHERE employee_code = '269';
UPDATE employees SET name = 'موساوي جهاد' WHERE employee_code = '270';
UPDATE employees SET name = 'قماري مازن حسنين' WHERE employee_code = '271';
UPDATE employees SET name = 'فاضل بلقاسم' WHERE employee_code = '273';
UPDATE employees SET name = 'غريسي معتز' WHERE employee_code = '274';
UPDATE employees SET name = 'بن الشهبة عبد العزيز' WHERE employee_code = '275';
UPDATE employees SET name = 'عتيق العربي يوسف' WHERE employee_code = '276';
UPDATE employees SET name = 'دية بوبكر' WHERE employee_code = '278';
UPDATE employees SET name = 'زغدي كمال' WHERE employee_code = '279';
UPDATE employees SET name = 'منيعي عبد الباسط' WHERE employee_code = '281';
UPDATE employees SET name = 'تجاني ايوب' WHERE employee_code = '284';
UPDATE employees SET name = 'قدوري مباركة' WHERE employee_code = '286';
UPDATE employees SET name = 'دشري عبد الجبار' WHERE employee_code = '287';
UPDATE employees SET name = 'بلقاضي لمنور' WHERE employee_code = '288';
UPDATE employees SET name = 'حمتين السعيد' WHERE employee_code = '289';
UPDATE employees SET name = 'برتيمة عبد الكريم' WHERE employee_code = '290';
UPDATE employees SET name = 'محبوب مصباح وليد' WHERE employee_code = '292';
UPDATE employees SET name = 'ميهوب يوسف' WHERE employee_code = '295';
UPDATE employees SET name = 'رداد المهدي' WHERE employee_code = '296';
UPDATE employees SET name = 'تليلي الطاهر 2' WHERE employee_code = '297';
UPDATE employees SET name = 'عطا الله رياض' WHERE employee_code = '298';
UPDATE employees SET name = 'يحياوي ياسين' WHERE employee_code = '299';
UPDATE employees SET name = 'عروة فتيحة' WHERE employee_code = '300';
UPDATE employees SET name = 'غنابزية عبد الكامل' WHERE employee_code = '302';
UPDATE employees SET name = 'مسعودي جمال' WHERE employee_code = '305';
UPDATE employees SET name = 'بلخضر ساعد' WHERE employee_code = '306';
UPDATE employees SET name = 'خلوط طارق' WHERE employee_code = '307';
UPDATE employees SET name = 'سمينة حنان' WHERE employee_code = '308';
UPDATE employees SET name = 'عبابة هاشم' WHERE employee_code = '309';
UPDATE employees SET name = 'بن بداري عبد الفتاح' WHERE employee_code = '310';
UPDATE employees SET name = 'يومبعي محمد' WHERE employee_code = '311';
UPDATE employees SET name = 'مداوي نسرين' WHERE employee_code = '312';
UPDATE employees SET name = 'هيمة ابراهيم' WHERE employee_code = '314';
UPDATE employees SET name = 'قديري حمزة' WHERE employee_code = '315';
UPDATE employees SET name = 'بوقطاية محمد السعيد' WHERE employee_code = '318';
UPDATE employees SET name = 'دبار الاخضر' WHERE employee_code = '319';
UPDATE employees SET name = 'دحمري فوزي' WHERE employee_code = '321';
UPDATE employees SET name = 'غنبازي مبروك' WHERE employee_code = '322';
UPDATE employees SET name = 'طالبي يوسف' WHERE employee_code = '324';
UPDATE employees SET name = 'مساعيد محمد الحبيب' WHERE employee_code = '325';
UPDATE employees SET name = 'مشري عماد الدين' WHERE employee_code = '326';
UPDATE employees SET name = 'بن عبد الله ايمن' WHERE employee_code = '328';
UPDATE employees SET name = 'دودو نبيل' WHERE employee_code = '329';
UPDATE employees SET name = 'بوضياف صبري' WHERE employee_code = '330';
UPDATE employees SET name = 'نيس ميلود' WHERE employee_code = '331';
UPDATE employees SET name = 'مداوي يوسف' WHERE employee_code = '333';
UPDATE employees SET name = 'مزيو محمد' WHERE employee_code = '334';
UPDATE employees SET name = 'بن غالي العربي' WHERE employee_code = '336';
UPDATE employees SET name = 'كوت نور الدين' WHERE employee_code = '337';
UPDATE employees SET name = 'منير عبد الكريم' WHERE employee_code = '339';
UPDATE employees SET name = 'دوش عبد القادر' WHERE employee_code = '340';
UPDATE employees SET name = 'بوضياف بوضياف' WHERE employee_code = '341';
UPDATE employees SET name = 'رحال عبد الباقي' WHERE employee_code = '344';
UPDATE employees SET name = 'بركة مسعود' WHERE employee_code = '345';
UPDATE employees SET name = 'فايزي المولدي' WHERE employee_code = '348';
UPDATE employees SET name = 'حمادي الحبيب' WHERE employee_code = '349';
UPDATE employees SET name = 'درويش عبد الله' WHERE employee_code = '351';
UPDATE employees SET name = 'تجيني حسين' WHERE employee_code = '352';
UPDATE employees SET name = 'براهمي عمار' WHERE employee_code = '353';
UPDATE employees SET name = 'سوفلي عبد الوهاب' WHERE employee_code = '356';
UPDATE employees SET name = 'طنش السعيد' WHERE employee_code = '357';
UPDATE employees SET name = 'مهيش ميلود' WHERE employee_code = '358';
UPDATE employees SET name = 'مسعي احمد البشير' WHERE employee_code = '359';
UPDATE employees SET name = 'بوغزالة محمد كريمة' WHERE employee_code = '361';
UPDATE employees SET name = 'سعيد صالح' WHERE employee_code = '365';
UPDATE employees SET name = 'بوذينة عماد الدين' WHERE employee_code = '366';
UPDATE employees SET name = 'دهيمي عبد الحافظ' WHERE employee_code = '368';
UPDATE employees SET name = 'كشحة عادل' WHERE employee_code = '369';
UPDATE employees SET name = 'تلحيق السعيد' WHERE employee_code = '371';
UPDATE employees SET name = 'حمدي البشير' WHERE employee_code = '372';
UPDATE employees SET name = 'غدير عمر عبد الغني' WHERE employee_code = '374';
UPDATE employees SET name = 'دوة محمد الحبيب' WHERE employee_code = '375';
UPDATE employees SET name = 'تجاني محمد الصادق' WHERE employee_code = '376';
UPDATE employees SET name = 'بيكي هيثم' WHERE employee_code = '378';
UPDATE employees SET name = 'شيحاني عبد الوهاب' WHERE employee_code = '379';
UPDATE employees SET name = 'زربيط محمد الطاهر' WHERE employee_code = '380';
UPDATE employees SET name = 'حشيفة فتحي' WHERE employee_code = '381';
UPDATE employees SET name = 'جاب الله عبد السلام' WHERE employee_code = '382';
UPDATE employees SET name = 'زين صلاح الدين' WHERE employee_code = '384';
UPDATE employees SET name = 'ربوح ميلود' WHERE employee_code = '387';
UPDATE employees SET name = 'يومبعي وائل' WHERE employee_code = '388';
UPDATE employees SET name = 'بن عمار احمد' WHERE employee_code = '389';
UPDATE employees SET name = 'عباسي عمر' WHERE employee_code = '394';
UPDATE employees SET name = 'بك اسامة' WHERE employee_code = '396';
UPDATE employees SET name = 'عامر جلال' WHERE employee_code = '397';
UPDATE employees SET name = 'طريلي خولة' WHERE employee_code = '399';
UPDATE employees SET name = 'ديدة الطاهر' WHERE employee_code = '401';
UPDATE employees SET name = 'بله عماد الدين' WHERE employee_code = '402';
UPDATE employees SET name = 'بن عمارة خيرة' WHERE employee_code = '403';
UPDATE employees SET name = 'سالم عبد السلام' WHERE employee_code = '404';
UPDATE employees SET name = 'كنيوة مريم' WHERE employee_code = '405';
UPDATE employees SET name = 'تجاني البشير' WHERE employee_code = '409';
UPDATE employees SET name = 'يومبعي محمد العيد' WHERE employee_code = '411';
UPDATE employees SET name = 'عية مراد' WHERE employee_code = '412';
UPDATE employees SET name = 'بن يامة عبد العزيز' WHERE employee_code = '413';
UPDATE employees SET name = 'عباسي السعيد' WHERE employee_code = '415';
UPDATE employees SET name = 'طنش عبد المالك' WHERE employee_code = '417';
UPDATE employees SET name = 'رزيق محمد' WHERE employee_code = '421';
UPDATE employees SET name = 'غريسي خليفة' WHERE employee_code = '422';
UPDATE employees SET name = 'عاشور الحاج سعد' WHERE employee_code = '425';
UPDATE employees SET name = 'قرح زكية' WHERE employee_code = '427';
UPDATE employees SET name = 'عسيلة ابراهيم' WHERE employee_code = '430';
UPDATE employees SET name = 'فايزي فؤاد' WHERE employee_code = '431';
UPDATE employees SET name = 'تجاني محمد الهادي' WHERE employee_code = '433';
UPDATE employees SET name = 'العايش احمد الثاني' WHERE employee_code = '436';
UPDATE employees SET name = 'تجاني محمد البشير' WHERE employee_code = '440';
UPDATE employees SET name = 'عقيب الزهرة' WHERE employee_code = '445';
UPDATE employees SET name = 'ثامر اذرير' WHERE employee_code = '449';
UPDATE employees SET name = 'دودو نور الدين' WHERE employee_code = '450';
UPDATE employees SET name = 'قوبعة محمد' WHERE employee_code = '454';
UPDATE employees SET name = 'سلطانة عبد المجيد' WHERE employee_code = '468';
UPDATE employees SET name = 'بيكي محمد رضا' WHERE employee_code = '469';
UPDATE employees SET name = 'زويزية مبروك' WHERE employee_code = '470';
UPDATE employees SET name = 'علاق العربي' WHERE employee_code = '471';
UPDATE employees SET name = 'رحال عثمان' WHERE employee_code = '472';
UPDATE employees SET name = 'غننة عبد الحاكم' WHERE employee_code = '473';
UPDATE employees SET name = 'رحالي السبتي' WHERE employee_code = '474';

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- ===== تحقق =====
SELECT COUNT(*) AS 'مكررات' FROM (SELECT employee_code, COUNT(*) c FROM employees GROUP BY employee_code HAVING c > 1) x;
SELECT COUNT(*) AS 'موظف بدون اسم' FROM employees WHERE name = employee_code OR name REGEXP '^[0-9]+$';
SELECT COUNT(*) AS 'الإجمالي' FROM employees;
SELECT employee_code, name FROM employees WHERE employee_code IN ('7','380','266','34') ORDER BY employee_code+0;