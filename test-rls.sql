-- Check if the user can insert into friends
SELECT * FROM pg_policies WHERE tablename = 'friends';
