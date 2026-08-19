import { indexer, type Match, type Bet, type Accumulator } from "envio";

indexer.onEvent(
  { contract: "FootballBetting", event: "MatchCreated" },
  async ({ event, context }) => {
    let match: Match = {
      id: event.params.matchId.toString(),
      matchId: event.params.matchId,
      homeTeam: event.params.homeTeam,
      awayTeam: event.params.awayTeam,
      totalHome: 0n,
      totalDraw: 0n,
      totalAway: 0n,
      resolved: false,
      result: 0n,
    };
    context.Match.set(match);
  },
);

indexer.onEvent(
  { contract: "FootballBetting", event: "BetPlaced" },
  async ({ event, context }) => {
    let matchId = event.params.matchId.toString();
    let match = await context.Match.get(matchId);
    let prediction = event.params.prediction;
    if (match !== undefined) {
      let updated: Match = {
        ...match,
        totalHome: prediction === 1 ? match.totalHome + event.params.amount : match.totalHome,
        totalDraw: prediction === 2 ? match.totalDraw + event.params.amount : match.totalDraw,
        totalAway: prediction === 3 ? match.totalAway + event.params.amount : match.totalAway,
      };
      context.Match.set(updated);
    }

    let betId = matchId + "-" + event.params.bettor;
    let bet: Bet = {
      id: betId,
      matchId: event.params.matchId,
      bettor: event.params.bettor,
      prediction: BigInt(prediction),
      amount: event.params.amount,
      claimed: false,
    };
    context.Bet.set(bet);
  },
);

indexer.onEvent(
  { contract: "FootballBetting", event: "MatchResolved" },
  async ({ event, context }) => {
    let matchId = event.params.matchId.toString();
    let match = await context.Match.get(matchId);
    if (match !== undefined) {
      let updated: Match = { ...match, resolved: true, result: BigInt(event.params.result) };
      context.Match.set(updated);
    }
  },
);

indexer.onEvent(
  { contract: "FootballBetting", event: "WinningsClaimed" },
  async ({ event, context }) => {
    let matchId = event.params.matchId.toString();
    let betId = matchId + "-" + event.params.bettor;
    let bet = await context.Bet.get(betId);
    if (bet !== undefined) {
      context.Bet.set({ ...bet, claimed: true });
    }
  },
);

indexer.onEvent(
  { contract: "FootballBetting", event: "AccumulatorPlaced" },
  async ({ event, context }) => {
    let acc: Accumulator = {
      id: event.params.accId.toString(),
      accId: event.params.accId,
      bettor: event.params.bettor,
      legCount: event.params.legCount,
      stake: event.params.stake,
      combinedOddsBps: event.params.combinedOddsBps,
      claimed: false,
    };
    context.Accumulator.set(acc);
  },
);

indexer.onEvent(
  { contract: "FootballBetting", event: "AccumulatorClaimed" },
  async ({ event, context }) => {
    let accId = event.params.accId.toString();
    let acc = await context.Accumulator.get(accId);
    if (acc !== undefined) {
      context.Accumulator.set({ ...acc, claimed: true });
    }
  },
);
