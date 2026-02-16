import type { ConfigurationDTO, DynamicValues } from "@shared/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getDynamicValuesLocal(config: ConfigurationDTO): DynamicValues {
  if (!config.escalationStartedAt) {
    return {
      winChance: config.winChanceStart,
      rewardPercent: config.rewardPercentStart,
      cycleProgress: 0,
      cycleSecondsLeft: config.escalationDurationMin * 60,
    };
  }

  const elapsed = Date.now() - new Date(config.escalationStartedAt).getTime();
  const totalMs = config.escalationDurationMin * 60 * 1000;
  const progress = (elapsed % totalMs) / totalMs;
  const secondsLeft = Math.ceil((totalMs - (elapsed % totalMs)) / 1000);

  return {
    winChance: round2(config.winChanceStart + progress * (config.winChanceEnd - config.winChanceStart)),
    rewardPercent: round2(config.rewardPercentStart + progress * (config.rewardPercentEnd - config.rewardPercentStart)),
    cycleProgress: round2(progress),
    cycleSecondsLeft: secondsLeft,
  };
}
