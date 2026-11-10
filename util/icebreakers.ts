// One of these goes in each new donut chat, so pairs have something to start with.
export const ICEBREAKERS = [
  "What's something you've gotten really into lately?",
  "What's the best thing you've eaten this month?",
  "If you could master one skill overnight, what would it be?",
  "What's a class or project you'd recommend to everyone?",
  "What's your go-to spot on or near campus?",
  "What's something you're looking forward to this quarter?",
  "What's a show, game, or book you'd tell a friend to try?",
  "What did you want to be when you were a kid?",
  "What's the most useful thing you've learned outside of class?",
  "What's a small thing that always makes your day better?",
  "If you could have dinner with anyone, who would it be?",
  "What's a hobby you'd pick up if you had more time?",
  "What's the best trip you've ever taken, or one you want to take?",
  "What's an unpopular opinion you'll defend?",
  "What got you interested in what you're studying?",
  "What's a song you've had on repeat?",
  "What's something you're proud of that most people don't know about?",
  "Coffee, tea, boba, or none of the above?",
  "What's the last thing that made you laugh out loud?",
  "What would your perfect weekend look like?",
];

export function randomIcebreaker(): string {
  return ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
}
