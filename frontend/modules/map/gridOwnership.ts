export function chooseGridOwner(
  sampleOwners: ReadonlyArray<string | null>,
): string | null {
  const minimumLandSamples = Math.floor(sampleOwners.length / 2) + 1;
  const counts = new Map<string, number>();
  let landSamples = 0;
  let winner: string | null = null;
  let winnerCount = 0;

  for (const owner of sampleOwners) {
    if (!owner) continue;

    landSamples += 1;
    const nextCount = (counts.get(owner) ?? 0) + 1;
    counts.set(owner, nextCount);
    if (nextCount > winnerCount) {
      winner = owner;
      winnerCount = nextCount;
    }
  }

  return landSamples >= minimumLandSamples ? winner : null;
}
