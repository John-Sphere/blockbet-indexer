import { indexer, type Match, type Bet, type Accumulator, type RouletteBet } from "envio";

indexer.onEvent(
  { contract: "BlockBet", event: "MatchCreated" },
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
  { contract: "BlockBet", event: "BetPlaced" },
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
      oddsBps: event.params.oddsBps,
      claimed: false,
      cashedOut: false,
    };
    context.Bet.set(bet);
  },
);

indexer.onEvent(
  { contract: "BlockBet", event: "BetCashedOut" },
  async ({ event, context }) => {
    let matchId = event.params.matchId.toString();
    let betId = matchId + "-" + event.params.bettor;
    let bet = await context.Bet.get(betId);
    if (bet !== undefined) {
      context.Bet.set({ ...bet, cashedOut: true });
    }
  },
);

indexer.onEvent(
  { contract: "BlockBet", event: "MatchResolved" },
  async ({ event, context }) => {
    let matchId = event.params.matchId.toString();
    let match = await context.Match.get(matchId);
    if (match !== undefined) {
      context.Match.set({ ...match, resolved: true, result: BigInt(event.params.result) });
    }
  },
);

indexer.onEvent(
  { contract: "BlockBet", event: "WinningsClaimed" },
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
  { contract: "BlockBet", event: "AccumulatorPlaced" },
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
  { contract: "BlockBet", event: "AccumulatorClaimed" },
  async ({ event, context }) => {
    let accId = event.params.accId.toString();
    let acc = await context.Accumulator.get(accId);
    if (acc !== undefined) {
      context.Accumulator.set({ ...acc, claimed: true });
    }
  },
);

indexer.onEvent(
  { contract: "BlockBet", event: "RouletteBetPlaced" },
  async ({ event, context }) => {
    let bet: RouletteBet = {
      id: event.params.betId.toString(),
      betId: event.params.betId,
      bettor: event.params.bettor,
      amount: event.params.amount,
      numberCount: event.params.numberCount,
      settled: false,
      winningNumber: undefined,
      payout: undefined,
    };
    context.RouletteBet.set(bet);
  },
);

indexer.onEvent(
  { contract: "BlockBet", event: "RouletteSettled" },
  async ({ event, context }) => {
    let betId = event.params.betId.toString();
    let bet = await context.RouletteBet.get(betId);
    if (bet !== undefined) {
      context.RouletteBet.set({
        ...bet,
        settled: true,
        winningNumber: event.params.winningNumber,
        payout: event.params.payout,
      });
    }
  },
);
