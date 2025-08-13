# Trivia Thief — Quiz Game

Trivia Thief is a fun, interactive quiz game built with HTML, CSS, and JavaScript. Choose your avatar, enter your name, select your difficulty, and answer as many questions as you can! Earn coins, unlock avatars, and climb the leaderboard while enjoying sound effects and lifelines like 50/50 and hints.

## Features

- **Multiple Avatars**: Pick from a variety of avatars. Some are unlockable with coins you earn in the game!
- **Difficulty Levels**: Choose between Easy, Medium, and Hard.
- **Randomized Questions**: Each game session shuffles questions for replayability.
- **Lifelines**: Use the 50/50 and Hint lifelines to help answer tricky questions (costs coins).
- **Animated Progress**: Progress bar and timer to keep you on your toes.
- **Fun Sound Effects**: Engaging audio feedback for actions and achievements.
- **Leaderboard**: Local leaderboard tracks top scores.
- **Coin Rewards**: Earn coins for correct answers and by opening chests.
- **Accessibility**: Keyboard navigation and ARIA labels for improved accessibility.
- **Responsive Design**: Works great on desktop and mobile browsers.
- **Google Analytics & Tag Manager**: Integrated for traffic and event tracking.

## Getting Started

### 1. Clone or Download

```
git clone https://github.com/yourusername/trivia-thief.git
```
Or download the ZIP and extract.

### 2. Add Your Questions

- Place your questions in a `Questions.json` file in the project directory, or use the built-in fallback questions.

### 3. Place Assets

- Images: `logo.png`, `coin.png`, `chest_closed.png`, `badgeone.png`, `badgetwo.png`
- Sounds: `start.mp3`, `tick.mp3`, `coin.mp3`, `chest.mp3`

### 4. Run the Game

Just open `index.html` in your web browser. No installation or server required!

## File Structure

```
trivia-thief/
├── index.html
├── Questions.json         # (optional) Your quiz questions
├── logo.png
├── coin.png
├── chest_closed.png
├── badgeone.png
├── badgetwo.png
├── start.wav
├── tick.wav
├── coin.wav
├── chest.wav
└── README.md
```

## Customization

- **Questions**: Edit `Questions.json` to add your own questions. The format should match the built-in fallback questions.
- **Avatars**: Adjust the avatars in the HTML to add or remove options.
- **Sounds/Graphics**: Swap out image and audio files for your own branding.

## Analytics & Tag Manager

- **Google Tag Manager** and **Google Analytics 4** are already included.  
- Update the GTM and GA4 IDs in the `<head>` and `<body>` if you want to use your own analytics accounts.

## Accessibility Notes

- All interactive elements are keyboard accessible.
- ARIA labels are provided for screen reader support.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Credits

- Quiz logic, styling, and sound effects: [YourName or Team]
- Built with HTML, CSS, JS — no frameworks required!

---

Enjoy playing, learning, and competing with Trivia Thief!
