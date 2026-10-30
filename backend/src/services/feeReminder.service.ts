import { pool } from '../config/database';
import { sendNotification } from '../config/firebase';

export interface FeeReminderResult {
  student_fee_id: string;
  student_name: string;
  grade: string;
  amount: number;
  due_date: string;
  reminder_type: '15_DAYS_BEFORE' | '2_DAYS_BEFORE' | '2_DAYS_OVERDUE' | '30_DAYS_OVERDUE';
  parent_email: string;
  fcm_sent: boolean;
  notice_created: boolean;
}

export const checkAndSendFeeReminders = async (): Promise<{
  total_checked: number;
  reminders_sent: number;
  results: FeeReminderResult[];
}> => {
  const client = await pool.connect();
  const results: FeeReminderResult[] = [];

  try {
    // Fetch all pending fees with their student and parent details
    const query = `
      SELECT 
        sf.id AS student_fee_id,
        sf.amount_due,
        sf.due_date::date AS due_date_val,
        TO_CHAR(sf.due_date, 'YYYY-MM-DD') AS due_date_str,
        (sf.due_date::date - CURRENT_DATE) AS diff_days,
        s.id AS student_id,
        s.first_name AS student_first_name,
        s.last_name AS student_last_name,
        s.grade,
        s.school_id,
        p.id AS parent_id,
        p.name AS parent_name,
        COALESCE(u.email, p.email) AS parent_email,
        u.id AS user_id,
        u.fcm_token
      FROM student_fees sf
      JOIN students s ON sf.student_id = s.id
      LEFT JOIN parents p ON s.parent_id = p.id
      LEFT JOIN users u ON (
        LOWER(u.email) = LOWER(p.email) 
        OR u.id = s.parent_id 
        OR u.id = p.id
        OR (LOWER(p.email) = 'parent.chinchwad@eduneev.com' AND LOWER(u.email) = 'parent@eduneev.com')
      )
      WHERE sf.status = 'pending' AND sf.amount_due > 0
    `;

    const res = await client.query(query);
    const pendingFees = res.rows;

    for (const row of pendingFees) {
      const diff = parseInt(row.diff_days, 10);
      let reminderType: '15_DAYS_BEFORE' | '2_DAYS_BEFORE' | '2_DAYS_OVERDUE' | '30_DAYS_OVERDUE' | null = null;
      let title = '';
      let body = '';

      if (diff === 15) {
        // 15 days remaining before due date
        reminderType = '15_DAYS_BEFORE';
        title = `⏳ Upcoming Fee: ₹${row.amount_due} due in 15 days`;
        body = `Reminder: School fee of ₹${row.amount_due} for ${row.student_first_name} (${row.grade}) is due on ${row.due_date_str}. Please pay soon.`;
      } else if (diff === 2) {
        // 2 days remaining before due date
        reminderType = '2_DAYS_BEFORE';
        title = `⚠️ Fee Due in 2 Days: ₹${row.amount_due}`;
        body = `Urgent Reminder: School fee of ₹${row.amount_due} for ${row.student_first_name} (${row.grade}) is due in 2 days on ${row.due_date_str}.`;
      } else if (diff === -2) {
        // 2 days ago / 2 days overdue
        reminderType = '2_DAYS_OVERDUE';
        title = `🚨 Fee Overdue by 2 Days: ₹${row.amount_due}`;
        body = `Important: School fee of ₹${row.amount_due} for ${row.student_first_name} was due 2 days ago (${row.due_date_str}). Please pay immediately.`;
      } else if (diff === -30 || diff === -31) {
        // 1 month ago / 30 days overdue
        reminderType = '30_DAYS_OVERDUE';
        title = `🛑 Critical: Fee Overdue by 1 Month (₹${row.amount_due})`;
        body = `Immediate Action: School fee of ₹${row.amount_due} for ${row.student_first_name} is overdue by 1 month (Due: ${row.due_date_str}). Please clear pending dues immediately.`;
      }

      if (!reminderType) continue;

      // Check if this reminder was already sent today
      const alreadySent = await client.query(
        `SELECT id FROM fee_reminders 
         WHERE student_fee_id = $1 AND reminder_type = $2 AND sent_date = CURRENT_DATE`,
        [row.student_fee_id, reminderType]
      );

      if (alreadySent.rows.length > 0) {
        continue;
      }

      // 1. Create In-App Notice for Parent / Student
      let noticeId: string | null = null;
      try {
        const noticeRes = await client.query(
          `INSERT INTO notices (title, content, audience, date, school_id)
           VALUES ($1, $2, $3, CURRENT_DATE, $4) RETURNING id`,
          [
            title,
            body,
            `student:${row.student_id}`,
            row.school_id || null,
          ]
        );
        noticeId = noticeRes.rows[0]?.id || null;
      } catch (e) {
        console.warn('Failed to insert in-app notice for fee reminder:', e);
      }

      // 2. Send Firebase Cloud Messaging (FCM) push notification
      let fcmSent = false;
      if (row.fcm_token) {
        try {
          await sendNotification(row.fcm_token, title, body, {
            type: 'fee_reminder',
            reminder_type: reminderType,
            student_id: row.student_id,
            student_fee_id: row.student_fee_id,
            amount: String(row.amount_due),
            due_date: row.due_date_str,
          });
          fcmSent = true;
        } catch (fcmErr) {
          console.error('Error sending fee push notification:', fcmErr);
        }
      }

      // 3. Record in fee_reminders log
      await client.query(
        `INSERT INTO fee_reminders (
          student_fee_id, student_id, parent_id, reminder_type, sent_date, fcm_sent, notice_id, amount
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7)
        ON CONFLICT (student_fee_id, reminder_type, sent_date) DO NOTHING`,
        [
          row.student_fee_id,
          row.student_id,
          row.parent_id || null,
          reminderType,
          fcmSent,
          noticeId,
          row.amount_due,
        ]
      );

      results.push({
        student_fee_id: row.student_fee_id,
        student_name: `${row.student_first_name} ${row.student_last_name || ''}`.trim(),
        grade: row.grade,
        amount: parseFloat(row.amount_due),
        due_date: row.due_date_str,
        reminder_type: reminderType,
        parent_email: row.parent_email || 'N/A',
        fcm_sent: fcmSent,
        notice_created: !!noticeId,
      });
    }

    return {
      total_checked: pendingFees.length,
      reminders_sent: results.length,
      results,
    };
  } catch (err) {
    console.error('Fee reminder service error:', err);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Preview fee reminders for all upcoming or overdue stages
 */
export const getPendingFeeRemindersSummary = async (): Promise<any> => {
  const query = `
    SELECT 
      sf.id AS student_fee_id,
      sf.amount_due,
      TO_CHAR(sf.due_date, 'YYYY-MM-DD') AS due_date,
      (sf.due_date::date - CURRENT_DATE) AS diff_days,
      CASE 
        WHEN (sf.due_date::date - CURRENT_DATE) = 15 THEN '15_DAYS_BEFORE'
        WHEN (sf.due_date::date - CURRENT_DATE) = 2 THEN '2_DAYS_BEFORE'
        WHEN (CURRENT_DATE - sf.due_date::date) = 2 THEN '2_DAYS_OVERDUE'
        WHEN (CURRENT_DATE - sf.due_date::date) >= 30 THEN '30_DAYS_OVERDUE'
        WHEN (sf.due_date::date < CURRENT_DATE) THEN 'OVERDUE'
        ELSE 'UPCOMING'
      END AS reminder_stage,
      s.first_name || ' ' || s.last_name AS student_name,
      s.grade,
      p.name AS parent_name,
      COALESCE(u.email, p.email) AS parent_email,
      u.fcm_token IS NOT NULL AS has_fcm_token
    FROM student_fees sf
    JOIN students s ON sf.student_id = s.id
    LEFT JOIN parents p ON s.parent_id = p.id
    LEFT JOIN users u ON (
      LOWER(u.email) = LOWER(p.email) 
      OR u.id = s.parent_id 
      OR u.id = p.id
      OR (LOWER(p.email) = 'parent.chinchwad@eduneev.com' AND LOWER(u.email) = 'parent@eduneev.com')
    )
    WHERE sf.status = 'pending' AND sf.amount_due > 0
    ORDER BY sf.due_date ASC
  `;

  const res = await pool.query(query);
  return res.rows;
};

/**
 * Starts automatic daily cron running every 24 hours
 */
export const startFeeReminderScheduler = () => {
  console.log('⏰ Fee Reminder Scheduler registered (Interval: Every 24 hours)');

  // Run initial check after 10 seconds of server boot
  setTimeout(async () => {
    try {
      console.log('🔍 Running scheduled fee reminder check...');
      const summary = await checkAndSendFeeReminders();
      console.log(`✅ Fee reminder check complete: ${summary.reminders_sent} reminder(s) sent out of ${summary.total_checked} pending fee(s).`);
    } catch (e) {
      console.error('Error during initial fee reminder run:', e);
    }
  }, 10000);

  // Set recurring daily interval (24 hours = 86,400,000 ms)
  setInterval(async () => {
    try {
      console.log('⏰ Daily recurring fee reminder check triggered...');
      const summary = await checkAndSendFeeReminders();
      console.log(`✅ Daily fee reminder check complete: ${summary.reminders_sent} reminder(s) sent.`);
    } catch (e) {
      console.error('Error during daily fee reminder run:', e);
    }
  }, 24 * 60 * 60 * 1000);
};
