# מערכת הזמנות מתקדמת עם חכמת מלאי ותאריכים - Mitnafun Intelligent Booking System

## סקירה כללית - Overview

מערכת ההזמנות החדשה של Mitnafun כוללת לוגיקה מתקדמת לניהול מלאי ותאריכים, המאפשרת שימוש יעיל יותר במלאי ומספקת חוויית משתמש טובה יותר. המערכת מטפלת בתרחישים שונים כגון:

1. **הצגת תאריכים מוזמנים** - מציגה תאריכים שכבר הוזמנו, ללא קשר לכמות המלאי
2. **סף זמן גמיש** - חוסמת רק הזמנות בטווח של 30 יום, כדי לא לחסום הזמנות עתידיות שלא לצורך
3. **התראות על תאריכי חיץ** - מציגה התראות על תאריכים הצמודים להזמנות קיימות

## רכיבים עיקריים - Core Components

### 1. פונקציות PHP - PHP Functions

#### `get_reserved_dates_ajax_handler()`
מטפל בבקשות AJAX לקבלת תאריכים מוזמנים עבור מוצר. מחזיר:
- רשימת תאריכים מוזמנים בטווח של 30 יום
- רשימת תאריכי חיץ (תאריכים צמודים להזמנות)
- כמות המלאי הנוכחית

#### `filter_future_reserved_dates($reserved_dates, $threshold_days = 30)`
מסנן תאריכים מוזמנים ומחזיר רק את אלה שבטווח הסף (ברירת מחדל: 30 יום).

#### `find_buffer_dates($all_reserved_dates)`
מזהה תאריכים שהם יום אחד לפני או אחרי הזמנות קיימות.

#### `is_date_beyond_threshold($date_str, $threshold_days = 30)`
בודק אם תאריך מסוים הוא מעבר לסף הזמן המוגדר.

### 2. קוד JavaScript - JavaScript Code

#### `buffer-date-handler.js`
- מזהה כאשר משתמש בוחר תאריך חיץ
- מציג הודעת אזהרה מותאמת אישית
- מטפל באינטראקציות לוח השנה

## כיצד לשנות הגדרות - How to Change Settings

### שינוי סף הזמן (30 יום) - Change Time Threshold

כדי לשנות את סף הזמן מ-30 יום לערך אחר:

1. פתח את הקובץ `functions.php`
2. מצא את הפונקציה `get_reserved_dates_ajax_handler()`
3. שנה את השורה:

```php
// Set threshold for future reservations (default: 30 days)
$threshold_days = 30;
```

לערך הרצוי, למשל 60 יום:

```php
// Set threshold for future reservations (60 days)
$threshold_days = 60;
```

### שינוי ימי חיץ (מ-1 יום ל-2 ימים או יותר) - Change Buffer Days

כדי לשנות את ימי החיץ מיום אחד לשני ימים או יותר:

1. פתח את הקובץ `functions.php`
2. מצא את הפונקציה `find_buffer_dates()`
3. שנה את השורות:

```php
// Check day before
$day_before = clone $booked_date;
$day_before->modify('-1 day');
$buffer_dates[] = $day_before->format('d.m.Y');

// Check day after
$day_after = clone $booked_date;
$day_after->modify('+1 day');
$buffer_dates[] = $day_after->format('d.m.Y');
```

לערך הרצוי, למשל 2 ימים:

```php
// Check 2 days before
$days_before_2 = clone $booked_date;
$days_before_2->modify('-2 day');
$buffer_dates[] = $days_before_2->format('d.m.Y');

// Check 1 day before
$days_before_1 = clone $booked_date;
$days_before_1->modify('-1 day');
$buffer_dates[] = $days_before_1->format('d.m.Y');

// Check 1 day after
$days_after_1 = clone $booked_date;
$days_after_1->modify('+1 day');
$buffer_dates[] = $days_after_1->format('d.m.Y');

// Check 2 days after
$days_after_2 = clone $booked_date;
$days_after_2->modify('+2 day');
$buffer_dates[] = $days_after_2->format('d.m.Y');
```

לשבוע שלם (3 ימים לפני ו-3 ימים אחרי):

```php
// Add 3 days before
for ($i = 1; $i <= 3; $i++) {
    $day_before = clone $booked_date;
    $day_before->modify("-$i day");
    $buffer_dates[] = $day_before->format('d.m.Y');
}

// Add 3 days after
for ($i = 1; $i <= 3; $i++) {
    $day_after = clone $booked_date;
    $day_after->modify("+$i day");
    $buffer_dates[] = $day_after->format('d.m.Y');
}
```

### שינוי הודעת האזהרה - Change Warning Message

כדי לשנות את הודעת האזהרה המוצגת עבור תאריכי חיץ:

1. פתח את הקובץ `js/buffer-date-handler.js`
2. מצא את הפונקציה `showBufferWarning()`
3. שנה את ה-HTML בתוך ה-template literal:

```javascript
const noticeHtml = `
    <div id="return-date-notice" style="margin: 15px 0; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px;">
        <strong style="color: #856404;">שימו לב:</strong> עבור תאריך זה קיימת החזרה של ציוד בשעות הבוקר.  
        זמן האיסוף עשוי להתעכב – מומלץ לתאם איתנו מראש.
    </div>
`;
```

## פתרון בעיות - Troubleshooting

### תאריכים לא מופיעים כמוזמנים

וודא שההזמנות מאחסנות את המטא דאטה "Rental Dates" בפורמט הנכון:
- פורמט: "DD.MM.YYYY - DD.MM.YYYY"
- בדוק בטבלת הנתונים wc_order_itemmeta את השדה meta_key="Rental Dates"

### בעיית הפניה לדף תשלום

אם לחצן ההזמנה לא מפנה לדף התשלום:
1. בדוק שיש class `btn-redirect` על הכפתור
2. וודא שהקוד הבא מופיע בפונקציה `mitnafun_add_redirect_field()`
3. האקטיוויישן צריך להיות בתוך הפונקציה `wp_footer`

### הזמנה על יום החזרה

על יום החזרה ניתן לבצע הזמנות - שים לב שזה התנהגות מכוונת המאפשרת הזמנה ביום שבו מוחזר המוצר.

## פיתוחים עתידיים אפשריים - Potential Future Enhancements

1. **ממשק ניהול** - הוספת הגדרות ב-WordPress Admin לניהול ערכי סף ותצורה
2. **תמחור דינמי** - התאמת מחירים בהתאם לתאריכי חיץ
3. **התאמת זמני החזרה וקבלה** - מערכת לקביעת זמני קבלה והחזרה מותאמים אישית
4. **מערכת תזכורות** - תזכורות אוטומטיות ללקוחות על החזרות קרובות

---

פותח עבור Mitnafun Rental System 
תאריך: מאי 2025
