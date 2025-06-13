import { Room, Client } from "colyseus.js";

export function requestJoinOptions(this: Client, i: number) {
  return { 
    playerName: `TestPlayer_${i}`,
    avatar: `test_avatar_${i % 5}` // Rotate through 5 test avatars
  };
}

export function onJoin(this: Room) {
  console.log(this.sessionId, "joined", this.name);

  // Simulate player movement every 2-5 seconds
  const moveInterval = setInterval(() => {
    if ((this.connection as any).readyState === 1) { // WebSocket.OPEN
      const x = Math.random() * 1600; // Random position within world bounds
      const y = Math.random() * 1200;
      const directions = ['front', 'back', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      
      this.send("player_move", {
        x: Math.round(x),
        y: Math.round(y),
        direction: direction,
        isMoving: true
      });
    }
  }, 2000 + Math.random() * 3000); // 2-5 seconds

  // Simulate occasional chat messages
  const chatInterval = setInterval(() => {
    if ((this.connection as any).readyState === 1 && Math.random() < 0.3) { // 30% chance
      const messages = [
        "Hello everyone!",
        "How's everyone doing?",
        "This is a test message",
        "Anyone want to discuss philosophy?",
        "Great to be here!"
      ];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      this.send("player_chat", {
        text: message,
        type: 'general'
      });
    }
  }, 10000 + Math.random() * 20000); // 10-30 seconds

  // Simulate philosopher interactions occasionally
  const interactInterval = setInterval(() => {
    if ((this.connection as any).readyState === 1 && Math.random() < 0.1) { // 10% chance
      const philosophers = ['socrates', 'aristotle', 'plato', 'descartes', 'chomsky'];
      const philosopherId = philosophers[Math.floor(Math.random() * philosophers.length)];
      
      this.send("philosopher_interact", {
        philosopherId: philosopherId,
        action: 'talk'
      });
    }
  }, 15000 + Math.random() * 30000); // 15-45 seconds

  // Cleanup intervals when leaving
  this.onLeave(() => {
    clearInterval(moveInterval);
    clearInterval(chatInterval);
    clearInterval(interactInterval);
  });
}

export function onLeave(this: Room, code: number) {
  console.log(this.sessionId, "left", this.name, code);
}

export function onError(this: Room, error: any) {
  console.log(this.sessionId, "error", error);
}

export function onStateChange(this: Room, state: any) {
  console.log(this.sessionId, "state change", Object.keys(state.players).length, "players");
}