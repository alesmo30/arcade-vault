-- Placeholder games with no engine (app/games/engines) and no real scores: drop them.
-- Only asteroides and tetris ship a playable engine; keep those.
delete from public.games where id not in ('asteroides', 'tetris');
