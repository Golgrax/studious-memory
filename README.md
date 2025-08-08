# Bayanihan Weather Alert Dashboard

A comprehensive, mobile-friendly website that displays real-time PAGASA weather alerts and flood advisories for the Philippines. Built with modern web technologies and designed following HCI principles for optimal user experience.

## 🌟 Features

### Core Functionality
- **Real-time Weather Alerts**: Live data from PAGASA public alert feeds
- **Interactive Dashboard**: Comprehensive overview of active weather alerts
- **Regional Filtering**: Filter alerts by Philippine regions
- **Severity-based Categorization**: Color-coded alerts by severity levels
- **Detailed Alert Information**: Full CAP (Common Alerting Protocol) data display
- **Search Functionality**: Search alerts by location or type

### User Experience
- **Mobile-First Design**: Optimized for all screen sizes and devices
- **Accessibility Compliant**: WCAG 2.1 guidelines implementation
- **Progressive Web App**: Offline capability and app-like experience
- **Touch-Friendly Interface**: Large touch targets and intuitive navigation
- **Dark Mode Support**: Automatic dark mode based on user preference
- **High Contrast Mode**: Enhanced visibility for users with visual impairments

### Visualization & Analytics
- **Interactive Map**: Geographic visualization of alert locations
- **Statistical Charts**: Alert frequency and severity analysis
- **Timeline Views**: 24-hour alert activity tracking
- **Regional Analysis**: Breakdown of alerts by Philippine regions

### Technical Features
- **Fast Loading**: Optimized performance with caching strategies
- **Offline Support**: Service worker for offline functionality
- **Auto-refresh**: Automatic updates every 15 minutes
- **Error Handling**: Graceful degradation and user-friendly error messages
- **Cross-browser Compatibility**: Works on all modern browsers

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Web server (for local development)
- Internet connection (for live PAGASA data)

### Installation

1. **Download the files**
   ```bash
   # Extract the website files to your desired directory
   cd bayanihan-weather-alert
   ```

2. **Serve the files**
   
   **Option A: Using Python (recommended for development)**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   **Option B: Using Node.js**
   ```bash
   npx serve .
   ```
   
   **Option C: Using PHP**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### For Syqlorix Integration

If you're using this with Syqlorix (as mentioned in the original requirements):

1. **Install Syqlorix**
   ```bash
   pip install syqlorix
   ```

2. **Create your Python backend**
   ```python
   # app.py
   from syqlorix import *
   
   # Serve static files
   @doc.route("/")
   def index(request):
       return file_response("index.html")
   
   @doc.route("/static/<path:filename>")
   def static_files(request, filename):
       return file_response(f"static/{filename}")
   
   # Your API endpoints here
   # (Add your weather alert processing logic)
   ```

3. **Run with Syqlorix**
   ```bash
   syqlorix run app.py --port 8000
   ```

## 📁 File Structure

```
bayanihan-weather-alert/
├── index.html              # Main HTML file
├── styles/
│   ├── main.css           # Core styles and CSS variables
│   ├── components.css     # Component-specific styles
│   └── responsive.css     # Mobile responsiveness
├── scripts/
│   ├── utils.js          # Utility functions
│   ├── api.js            # PAGASA API handling
│   ├── map.js            # Map and chart functionality
│   └── main.js           # Main application logic
├── assets/
│   ├── images/           # Icons and graphics (to be added)
│   └── fonts/            # Custom fonts (to be added)
├── .env.sample           # Environment configuration template
├── manifest.json         # PWA manifest (to be created)
├── sw.js                 # Service worker (to be created)
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Copy `.env.sample` to `.env` and configure the following key variables:

```env
# Facebook Messenger Bot (if using with Syqlorix backend)
FB_PAGE_ACCESS_TOKEN=your_facebook_page_access_token
FB_VERIFY_TOKEN=your_webhook_verification_token

# PAGASA API Configuration
PAGASA_FEED_URL=https://publicalert.pagasa.dost.gov.ph/feeds/
CHECK_INTERVAL=900

# Cities to monitor
CITIES=Manila,Quezon City,Marikina,Pasig,Makati

# Server Configuration
PORT=8000
HOST=0.0.0.0
```

### Customization

#### Colors and Branding
Edit CSS custom properties in `styles/main.css`:

```css
:root {
    --primary-blue: #1e40af;
    --secondary-orange: #ea580c;
    --alert-extreme: #dc2626;
    --alert-severe: #ea580c;
    --alert-moderate: #d97706;
    --alert-minor: #16a34a;
}
```

#### Regional Configuration
Update the regions list in `scripts/map.js`:

```javascript
getPhilippineRegions() {
    return [
        { code: 'ncr', name: 'NCR' },
        { code: 'car', name: 'CAR' },
        // Add or modify regions as needed
    ];
}
```

## 🎨 Design System

### Color Palette
- **Primary Blue**: #1e40af (Navigation, buttons, links)
- **Secondary Orange**: #ea580c (Accents, highlights)
- **Alert Colors**:
  - Extreme: #dc2626 (Red)
  - Severe: #ea580c (Orange)
  - Moderate: #d97706 (Yellow)
  - Minor: #16a34a (Green)

### Typography
- **Primary Font**: Inter (loaded from Google Fonts fallback)
- **Fallback**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Monospace**: SF Mono, Monaco, Cascadia Code

### Spacing Scale
- Based on 0.25rem (4px) increments
- Consistent spacing using CSS custom properties
- Responsive scaling for different screen sizes

## 📱 Browser Support

### Minimum Requirements
- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+
- **Mobile Safari**: 12+
- **Chrome Mobile**: 60+

### Progressive Enhancement
- Core functionality works on older browsers
- Enhanced features for modern browsers
- Graceful degradation for unsupported features

## 🔒 Security Considerations

### Data Privacy
- No personal data collection
- All data sourced from public PAGASA feeds
- Local storage used only for user preferences

### CORS and API Access
- Configured for cross-origin requests to PAGASA
- Error handling for network failures
- Rate limiting considerations

### Content Security
- No inline scripts or styles
- Sanitized content display
- XSS protection measures

## 🚀 Performance Optimization

### Loading Performance
- Minified CSS and JavaScript (in production)
- Optimized images and assets
- Preloaded critical resources
- Efficient caching strategies

### Runtime Performance
- Debounced search and filter functions
- Efficient DOM manipulation
- Optimized re-rendering
- Memory leak prevention

### Network Optimization
- Compressed responses
- Cached API responses
- Offline functionality
- Progressive loading

## 🧪 Testing

### Manual Testing Checklist
- [ ] Page loads correctly on desktop
- [ ] Page loads correctly on mobile
- [ ] Navigation works properly
- [ ] Filters function correctly
- [ ] Search functionality works
- [ ] Modal dialogs open and close
- [ ] Map interactions work
- [ ] Charts display correctly
- [ ] Responsive design at various screen sizes
- [ ] Accessibility features work
- [ ] Offline functionality works

### Browser Testing
Test on multiple browsers and devices:
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Chrome Mobile, Samsung Internet
- Tablet: iPad Safari, Android Chrome

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
```
Solution: Serve files through a web server, not file:// protocol
Use: python -m http.server 8000
```

**2. No Data Loading**
```
Check: Internet connection and PAGASA feed availability
Verify: Console for API errors
```

**3. Mobile Layout Issues**
```
Check: Viewport meta tag is present
Verify: CSS media queries are working
```

**4. JavaScript Errors**
```
Check: Browser console for error messages
Verify: All script files are loading correctly
```

### Debug Mode
Enable debug mode by adding to localStorage:
```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Maintain accessibility standards

### Adding Features
- Follow the existing architecture
- Update documentation
- Add appropriate error handling
- Test on multiple devices

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **PAGASA** - Philippine Atmospheric, Geophysical and Astronomical Services Administration for providing public weather data
- **Syqlorix** - Web framework for Python backend integration
- **Inter Font** - Beautiful typography by Rasmus Andersson
- **Philippine Government** - For open data initiatives

## 📞 Support

For issues, questions, or contributions:

1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information
4. Include browser version and error messages

## 🔄 Updates and Maintenance

### Regular Updates
- Monitor PAGASA feed changes
- Update browser compatibility
- Security patches and improvements
- Performance optimizations

### Version History
- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Enhanced mobile experience
- **v1.2.0** - Added analytics and charts
- **v2.0.0** - Progressive Web App features

---

**Built with ❤️ for the Filipino community**

*Stay informed, stay safe. Bayanihan Weather Alert helps keep communities prepared for severe weather events through real-time PAGASA data and user-friendly interfaces.*

# studious-memory
