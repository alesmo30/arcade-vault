import { getGames } from "@/app/data/queries";
import { HomeClient } from "@/app/home-client";

export default async function Home() {
  const games = await getGames();
  return <HomeClient games={games} />;
}
