CREATE OR REPLACE FUNCTION get_category_analytics()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_category_breakdown json;
  v_monthly_trend json;
  v_expense_frequency json;
  v_result json;
BEGIN
  -- 1. Category Breakdown (Sum of amounts by category)
  SELECT COALESCE(json_agg(row_to_json(cb)), '[]'::json) INTO v_category_breakdown
  FROM (
    SELECT 
      c.name, 
      c.color, 
      SUM(e.amount) as value
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.deleted_at IS NULL
    GROUP BY c.id, c.name, c.color
    ORDER BY value DESC
  ) cb;

  -- 2. Monthly Trend (Total amounts grouped by month for the last 6 months)
  SELECT COALESCE(json_agg(row_to_json(mt)), '[]'::json) INTO v_monthly_trend
  FROM (
    SELECT 
      to_char(date_trunc('month', e.expense_date), 'Mon YYYY') as month,
      date_trunc('month', e.expense_date) as sort_date,
      SUM(e.amount) as total_amount
    FROM expenses e
    WHERE e.deleted_at IS NULL
      AND e.expense_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY date_trunc('month', e.expense_date)
    ORDER BY sort_date ASC
  ) mt;

  -- 3. Expense Frequency (Count of expenses by category)
  SELECT COALESCE(json_agg(row_to_json(ef)), '[]'::json) INTO v_expense_frequency
  FROM (
    SELECT 
      c.name, 
      c.color,
      COUNT(e.id) as frequency
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.deleted_at IS NULL
    GROUP BY c.id, c.name, c.color
    ORDER BY frequency DESC
  ) ef;

  -- Build JSON object to return
  v_result := json_build_object(
    'category_breakdown', v_category_breakdown,
    'monthly_trend', v_monthly_trend,
    'expense_frequency', v_expense_frequency
  );

  RETURN v_result;
END;
$$;
