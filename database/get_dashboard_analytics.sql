  CREATE OR REPLACE FUNCTION get_dashboard_analytics()
  RETURNS json
  LANGUAGE plpgsql
  AS $$
  DECLARE
    v_total_expenses numeric;
    v_this_month_expenses numeric;
    v_average_expense numeric;
    v_largest_expense numeric;
    v_most_frequent_category_id uuid;
    v_most_active_member_id uuid;
    v_result json;
  BEGIN
    -- 1. Total Expenses
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM expenses
    WHERE deleted_at IS NULL;

    -- 2. This Month Expenses
    SELECT COALESCE(SUM(amount), 0) INTO v_this_month_expenses
    FROM expenses
    WHERE deleted_at IS NULL
      AND date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE);

    -- 3. Average Expense
    SELECT COALESCE(AVG(amount), 0) INTO v_average_expense
    FROM expenses
    WHERE deleted_at IS NULL;

    -- 4. Largest Expense
    SELECT COALESCE(MAX(amount), 0) INTO v_largest_expense
    FROM expenses
    WHERE deleted_at IS NULL;

    -- 5. Most Frequent Category
    SELECT category_id INTO v_most_frequent_category_id
    FROM expenses
    WHERE deleted_at IS NULL
    GROUP BY category_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- 6. Most Active Member (by participation in expenses)
    SELECT member_id INTO v_most_active_member_id
    FROM expense_participants
    GROUP BY member_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- Build JSON object to return
    v_result := json_build_object(
      'total_expenses', v_total_expenses,
      'this_month_expenses', v_this_month_expenses,
      'average_expense', v_average_expense,
      'largest_expense', v_largest_expense,
      'most_frequent_category_id', v_most_frequent_category_id,
      'most_active_member_id', v_most_active_member_id
    );

    RETURN v_result;
  END;
  $$;
