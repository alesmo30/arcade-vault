import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Game, GameWithBest, ScoreRow } from "./types";

function toScoreRows(
  rows: { player_name: string; score: number; created_at: string }[],
): ScoreRow[] {
  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.player_name,
    score: r.score,
    date: new Date(r.created_at).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  }));
}

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, title, short, long, cat, cover, color, plays, sort")
    .order("sort", { ascending: true });

  if (error) throw error;
  return data as Game[];
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, title, short, long, cat, cover, color, plays, sort")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as Game | null;
}

export async function getTopScores(gameId: string, limit: number): Promise<ScoreRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return toScoreRows(data ?? []);
}

export async function getBestScore(gameId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("score")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.score ?? 0;
}

export async function getGameWithBest(id: string): Promise<GameWithBest | null> {
  const game = await getGameById(id);
  if (!game) return null;
  const best = await getBestScore(id);
  return { ...game, best };
}

export async function getGamesWithBest(): Promise<GameWithBest[]> {
  const supabase = await createClient();
  const [games, { data: scores, error }] = await Promise.all([
    getGames(),
    supabase.from("scores").select("game_id, score"),
  ]);

  if (error) throw error;

  const bestByGame = new Map<string, number>();
  for (const row of scores ?? []) {
    const current = bestByGame.get(row.game_id) ?? 0;
    if (row.score > current) bestByGame.set(row.game_id, row.score);
  }

  return games.map((game) => ({ ...game, best: bestByGame.get(game.id) ?? 0 }));
}
