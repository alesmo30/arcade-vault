import { getGames, getTopScores } from "@/app/data/queries";
import { HallTabs } from "@/app/components/hall-tabs";
import type { ScoreRow } from "@/app/data";

export default async function HallOfFamePage() {
  const games = await getGames();
  const scoresList = await Promise.all(games.map((g) => getTopScores(g.id, 12)));

  const scoresByGame: Record<string, ScoreRow[]> = {};
  games.forEach((g, i) => {
    scoresByGame[g.id] = scoresList[i];
  });

  return <HallTabs games={games} scoresByGame={scoresByGame} />;
}
