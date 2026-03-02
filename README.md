# RNK Quick Chug

A production-ready Foundry VTT v13 module providing a bonus action potion quick-access system for faster potion consumption in combat.

## Features

### Scene Control Access
- **Toolbar Integration**: Toggle the Quick Chug Belt directly from the "Tokens" layer in the Scene Controls.
- **ApplicationV2 UI**: A modern, standalone belt window built with the latest Foundry v13 API.

### Quick Potion Belt
- **5 Quick-Access Slots**: Store your most-used potions for instant access
- **Drag & Drop Assignment**: Simply drag potions from your inventory to assign them
- **Bonus Action Usage**: Use potions as bonus actions directly from the belt
- **Visual Feedback**: Professional UI with item images, quantities, and hover effects
- **Mobile Responsive**: Fully responsive design for all screen sizes

### System Support
- **Dungeons & Dragons 5e**: Full integration with D&D 5e consumable system
- **System Agnostic**: Generic consumable support for other systems
- **Framework Integration**: Works with any sheet rendering system in Foundry

### Advanced Features
- **Drag-Over Visual Effects**: See where items will be placed with live feedback
- **Clear Button**: Quickly remove potions from slots with a single click
- **Empty Slot Indicators**: See which slots are available at a glance
- **Automatic Validation**: Only valid consumables can be added to the belt
- **Dark/Light Theme Support**: Automatically adapts to your UI theme
- **Accessibility**: Full keyboard navigation and screen reader support

## Installation

### Method 1: Download from Foundry Module Browser
1. In Foundry VTT, go to **Add-on Modules**
2. Click **Install Module**
3. Search for "RNK Quick Chug"
4. Click **Install**

### Method 2: Manual Installation
1. Download the latest release from GitHub
2. Extract to `foundrydata/modules/rnk-quick-chug`
3. Restart Foundry
4. Enable in **Module Management**

## Usage

### Basic Workflow
1. **Open Character Sheet**: Right-click character → Edit
2. **Locate Belt**: Scroll down to "RNK Quick Chug" section
3. **Assign Potions**: Drag potions from inventory to belt slots
4. **Use in Combat**: Click any belt slot to consume the potion as a bonus action

### Slot Management
- **Assign Item**: Drag from inventory → drop in empty slot
- **Replace Item**: Drag new item over occupied slot
- **Remove Item**: Click × button in top-right of slot
- **Check Quantity**: Hover over item to see remaining quantity

### Tips
- Assign your most-used potions for quick access
- The belt persists between sessions
- Works with all consumable item types
- UI automatically updates when items are consumed

## Configuration

No configuration required! The module works out of the box with sensible defaults.

### Future Configuration Options
- Adjustable number of quick-access slots
- Configurable hotkeys for bonus actions
- Integration with Argon Combat HUD
- Custom UI styling options

## System Requirements

- **Foundry VTT**: v13 or higher
- **D&D 5e System**: v3.0+ (for full feature support)
- **Browser**: Modern browser with ES2021 support

## Dependencies

- **None**: Module runs standalone without dependencies

## Compatibility

### Tested & Compatible
- D&D 5e (v3.0+)
- Pathfinder 1e
- Pathfinder 2e
- Other systems with consumable item types

### Known Issues
- None reported

## File Structure

```
rnk-quick-chug/
├── module.json                 # Module manifest
├── package.json                # NPM package config
├── LICENSE                     # RNK Proprietary License
├── README.md                   # This file
├── CHANGELOG.md                # Release history
├── .gitignore                  # Git exclusions
├── jest.config.js              # Test configuration
├── .eslintrc.json              # Linting rules
├── scripts/
│   ├── quick-chug-belt.js      # Module initialization
│   ├── belt-api.js             # Core belt API (271 LOC)
│   └── belt-sheet.js           # UI manager (338 LOC)
├── templates/
│   └── belt-section.hbs        # Belt template
├── styles/
│   └── quick-chug-belt.css     # Professional styling
├── lang/
│   └── en.json                 # English localization
└── tests/
    ├── belt-api.test.js        # Unit tests
    └── belt-sheet.test.js      # Integration tests
```

## Code Quality

This module maintains the **RNK 100/100/100/100 Standard**:
- **Code Coverage**: 100% test coverage with Jest
- **Functionality**: 100% feature completeness
- **Performance**: 100% optimized render cycles
- **Design**: 100% professional UI/UX

### Testing
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

### Linting
```bash
npm run lint               # Check code quality
npm run lint:fix           # Fix linting issues
```

## Architecture

### Module Initialization (quick-chug-belt.js)
- Registers module hooks
- Injects belt UI into character sheets
- Manages lifecycle events

### Belt API (belt-api.js)
- Slot management using actor flags
- Item validation and consumption
- System integration hooks

### UI Manager (belt-sheet.js)
- HTML injection and templating
- Drag & drop event handling
- Click and interaction management

### Styling (quick-chug-belt.css)
- Professional responsive grid layout
- Dark/light theme support
- Accessibility features (WCAG 2.1 AA)

## Development

### Setup
```bash
npm install
```

### Local Testing
1. Symlink module to Foundry data: `ln -s /path/to/rnk-quick-chug foundrydata/modules/`
2. Enable in Foundry Module Management
3. Open browser console for debug output

### Build Process
No build step required—module uses native ESM.

## API Reference

### getBeltSlots(actor)
Returns array of 5 item IDs in actor's belt

### setBeltSlot(actor, index, itemId)
Sets item in specific slot

### consumeBeltItem(actor, index)
Uses item from belt slot

### getBeltItems(actor)
Returns array of Item objects currently in belt

### initializeBeltForActor(actor)
Initializes belt slots for new actor

See `scripts/belt-api.js` for full API documentation.

## Localization

Currently supports English. Translation contributions welcome!

**Available Keys**: 21 localization strings (see `lang/en.json`)

## Roadmap

### v1.1.0
- Argon Combat HUD integration
- Configurable slot count
- Settings panel

### v1.2.0
- Hotkey support for quick actions
- Multi-character belt presets
- Advanced item filtering

### v2.0.0
- Macro integration
- Custom UI themes
- Mobile app support

## Troubleshooting

### Belt Not Appearing
- Module enabled in Module Management?
- Reload page (F5)
- Check browser console for errors

### Items Can't Be Added
- Item must be consumable type
- Item must have quantity > 0
- Item must be in character inventory

### Performance Issues
- Check if many actors are rendered simultaneously
- Module is optimized for single actor view
- Report performance issues on GitHub

## Support

### Report Issues
GitHub Issues: https://github.com/RNK-Enterprise/rnk-quick-chug/issues

### Get Help
- Discord: [RNK Community](https://discord.gg/rnk-community)
- Documentation: This README
- Code Examples: See `tests/` directory

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

RNK Proprietary Software License v1.0
See [LICENSE](LICENSE) file for details.

© 2026 The Curator. All rights reserved.

## Credits

**Development**: The Curator
**Testing**: RNK Community
**UI Design**: Professional Foundry VTT standards
**Framework**: Foundry VTT v13, ESM modules

### Special Thanks

**Nijotu** (Netherlands) — The original idea for RNK Quick Chug came from Nijotu on Discord. His feedback and vision for a fast, no-fuss potion belt directly inspired this module. Much appreciated from across the Atlantic! 🇳🇱

## Contributing

This is a proprietary module. Source code is closed. Feature requests and bug reports welcome through GitHub Issues.

---

**Version**: 1.0.0
**Last Updated**: March 2, 2026
**Status**: Production Ready
