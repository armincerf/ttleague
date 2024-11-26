type PlayerInfo = {
    userId: string;
    lastPlayedAt?: Date;
    lastUmpiredAt?: Date;
    usersPlayedToday?: string[];
    timesUmpiredToday?: number;
  };
  
  type Match = {
    playerOneId: string;
    playerTwoId: string;
    umpireId: string;
  };
  
  export function performMatchmaking(players: PlayerInfo[]): Match[] {
    // Create deep copies to avoid mutating the original arrays
    const availablePlayers = [...players];
    const availableUmpires = [...players];
  
    // Sort players: first by whether they have never played, then by last played time (oldest first)
    availablePlayers.sort((a, b) => {
      if (!a.lastPlayedAt && b.lastPlayedAt) return -1;
      if (a.lastPlayedAt && !b.lastPlayedAt) return 1;
      if (!a.lastPlayedAt && !b.lastPlayedAt) return a.userId.localeCompare(b.userId);
      return (a.lastPlayedAt?.getTime() ?? 0) - (b.lastPlayedAt?.getTime() ?? 0) || a.userId.localeCompare(b.userId);
    });
  
    // Sort umpires: first by whether they have never umpired, then by last umpired time (oldest first)
    availableUmpires.sort((a, b) => {
      if (!a.lastUmpiredAt && b.lastUmpiredAt) return -1;
      if (a.lastUmpiredAt && !b.lastUmpiredAt) return 1;
      if (!a.lastUmpiredAt && !b.lastUmpiredAt) return a.userId.localeCompare(b.userId);
      return (a.lastUmpiredAt?.getTime() ?? 0) - (b.lastUmpiredAt?.getTime() ?? 0) || a.userId.localeCompare(b.userId);
    });
  
    const matches: Match[] = [];
    const usedUsers = new Set<string>();
  
    while (availablePlayers.length >= 2 && availableUmpires.length > 0) {
      // Select player one
      const playerOne = availablePlayers.find((p) => !usedUsers.has(p.userId));
      if (!playerOne) break;
  
      // Exclude player one from selection
      const excludeIds = new Set<string>([playerOne.userId, ...usedUsers]);
  
      // Find player two who hasn't played against player one today and hasn't been used yet
      const playerTwo = availablePlayers.find(
        (p) =>
          !excludeIds.has(p.userId) &&
          (!playerOne.usersPlayedToday || !playerOne.usersPlayedToday.includes(p.userId))
      );
  
      if (!playerTwo) {
        // No suitable player two found; mark player one as used to prevent infinite loops
        usedUsers.add(playerOne.userId);
        continue;
      }
  
      excludeIds.add(playerTwo.userId);
  
      // Find an umpire who hasn't been used and is not one of the players
      const umpire = availableUmpires.find(
        (u) => !excludeIds.has(u.userId) && !usedUsers.has(u.userId)
      );
  
      if (!umpire) {
        // No suitable umpire found; break the loop
        break;
      }
  
      // Mark the users as used
      usedUsers.add(playerOne.userId);
      usedUsers.add(playerTwo.userId);
      usedUsers.add(umpire.userId);
  
      // Add the match
      matches.push({
        playerOneId: playerOne.userId,
        playerTwoId: playerTwo.userId,
        umpireId: umpire.userId,
      });
    }
  
    return matches;
  }
  