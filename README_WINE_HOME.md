# Wine Home Page - Beautiful Wine Data Visualization

This project displays beautiful wine data from the Vivino API with a modern, elegant UI.

## Features

- **Hero Section**: Eye-catching wine bottle display with floating animation
- **Rating System**: Visual star ratings and detailed rating distribution
- **Wine Profile**: Comprehensive wine information (alcohol content, body, acidity, grapes)
- **Food Pairings**: Beautiful food pairing cards with images
- **Awards & Highlights**: Showcases wine achievements and accolades
- **Recommended Vintages**: Different vintage recommendations with ratings
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Loading Animation**: Wine glass filling animation during data fetch
- **Smooth Animations**: Hover effects and transitions throughout

## Prerequisites

1. **Backend API**: Ensure your backend server is running on `http://localhost:7000`
2. **Node.js**: Version 16 or higher
3. **npm**: Comes with Node.js

## Installation & Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser to `http://localhost:3000`

## API Configuration

The app calls the following API endpoint:

```
POST http://localhost:7000/api/v1/wine/demo_vivino
```

**Request Body:**
```json
{
  "wine_name": "Feudi Bizantini Il Rabdomante Montepulciano d'Abruzzo",
  "min_similarity": 0.4,
  "currency_code": "THB",
  "price_range_max": 1000
}
```

To change the wine being displayed, modify the `fetchWineData` function in `src/components/WineHomePage.tsx`.

## Project Structure

```
src/
├── components/
│   ├── WineHomePage.tsx    # Main wine display component
│   └── WineHomePage.css    # Styling for wine page
├── App.tsx                  # Main app component
├── App.css                  # App styles
├── index.tsx               # Entry point
└── index.css               # Global styles
```

## Customization

### Colors
The color scheme uses a purple gradient theme. To change colors, modify these CSS variables in `WineHomePage.css`:

- Primary gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Wine color: `#722f37`
- Accent color: `#ffd700` (gold for stars)

### API Endpoint
To change the API endpoint, edit the `fetchWineData` function in `WineHomePage.tsx`:

```typescript
const response = await fetch('YOUR_API_ENDPOINT', {
  // ... configuration
});
```

## Component Features

### Loading State
- Animated wine glass filling effect
- Smooth loading transitions

### Error Handling
- User-friendly error messages
- Retry button for failed requests

### Responsive Breakpoints
- Desktop: > 768px
- Tablet: 481px - 768px
- Mobile: < 480px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend server has CORS enabled:

```javascript
// Example for Express.js
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

### API Connection Failed
1. Check if the backend server is running on port 7000
2. Verify the API endpoint URL
3. Check network tab in browser DevTools for error details

### Images Not Loading
The wine images use Vivino's CDN. Ensure the URLs start with `https:` prefix.

## Future Enhancements

- [ ] Search functionality to look up different wines
- [ ] User reviews section
- [ ] Wine comparison feature
- [ ] Favorite wines list
- [ ] Wine cellar management
- [ ] Price history charts
- [ ] Social sharing capabilities

## Technologies Used

- **React 19.1.1** - UI framework
- **TypeScript 4.9.5** - Type safety
- **CSS3** - Modern styling with animations
- **Fetch API** - HTTP requests

## License

This project is part of the Wine Miss You application.
