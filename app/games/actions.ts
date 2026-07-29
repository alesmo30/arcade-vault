"use server";

import { createClient } from "@/lib/supabase/admin";

export type SaveScoreResult = { ok: boolean; error?: string };

export async function saveScore(input: {
  gameId: string;
  playerName: string;
  score: number;
}): Promise<SaveScoreResult> {
  const gameId = input.gameId.trim();
  const playerName = input.playerName.trim();
  const score = Math.floor(input.score);

  if (!gameId) return { ok: false, error: "FALTA EL JUEGO" };
  if (!playerName || playerName.length > 20) return { ok: false, error: "NOMBRE INVÁLIDO" };
  if (!Number.isFinite(score) || score < 0) return { ok: false, error: "PUNTUACIÓN INVÁLIDA" };

  const supabase = createClient();

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, plays")
    .eq("id", gameId)
    .maybeSingle();

  if (gameError) return { ok: false, error: gameError.message };
  if (!game) return { ok: false, error: "JUEGO NO ENCONTRADO" };

  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player_name: playerName, score });

  if (error) return { ok: false, error: error.message };

  if (/^\d+$/.test(game.plays)) {
    await supabase
      .from("games")
      .update({ plays: String(Number(game.plays) + 1) })
      .eq("id", gameId);
  }

  return { ok: true };
}
