-- Create trigger function to auto-assign task numbers
CREATE OR REPLACE FUNCTION assign_task_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get and increment the next_task_number for this project
  UPDATE project
  SET next_task_number = next_task_number + 1
  WHERE id = NEW.project_id
  RETURNING next_task_number - 1 INTO NEW.number;
  
  -- If no project found or number still null, default to 1
  IF NEW.number IS NULL THEN
    NEW.number := 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert on task
DROP TRIGGER IF EXISTS task_assign_number_trigger ON task;
CREATE TRIGGER task_assign_number_trigger
  BEFORE INSERT ON task
  FOR EACH ROW
  WHEN (NEW.number IS NULL)
  EXECUTE FUNCTION assign_task_number();

-- Backfill existing tasks that have null numbers
WITH numbered_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) as new_number
  FROM task
  WHERE number IS NULL
)
UPDATE task
SET number = numbered_tasks.new_number
FROM numbered_tasks
WHERE task.id = numbered_tasks.id;

-- Update project next_task_number to be max + 1 for each project
UPDATE project p
SET next_task_number = COALESCE(
  (SELECT MAX(number) + 1 FROM task WHERE project_id = p.id),
  1
);
