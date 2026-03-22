# Urban Pot — Real Nigerian Flavour

## Setup Instructions

### 1. Supabase
Project URL: https://dmobxrgjmutnyhhttqia.supabase.co
Create a `foods` table with these columns:
- id (int8, primary key)
- name (text)
- price (numeric)
- category (text) — values: rice, soup, special, spaghetti
- day (text) — values: monday, tuesday, wednesday, thursday, friday, saturday, sunday, special
- image (text) — full public URL from Supabase Storage
- description (text)
- available (bool)
- options (jsonb)

### 2. Image Assets Required
Place these in `/assets/images/`:
- hero-bowl.png — Hero section food image (transparent PNG preferred)
- category-rice.png — Rice dishes category
- category-soup.png — Soups category
- bestseller-jollof.png
- bestseller-egusi.png
- bestseller-rice-stew.png
- bestseller-okra.png
- about-bowl.png

### 3. Paystack
Replace `pk_live_xxxxxxxxxxxxxxxx` in script.js with your actual Paystack public key.

### 4. Deploy to GitHub Pages
Push all files to a GitHub repository and enable GitHub Pages in Settings > Pages.

## File Structure
```
urban-pot/
├── index.html       — Homepage
├── menu.html        — Daily menu listing
├── product.html     — Product detail & ordering
├── style.css        — All styles
├── script.js        — Shared JS (cart, kitchen hours, etc.)
└── assets/
    └── images/
        └── [all food images here]
```

## Pricing Logic
### Rice/Spaghetti
- 1L: ₦3,000 | 2L: ₦5,000 | 3L: ₦7,000 | 4L: ₦9,000 | 5L: ₦12,000

### Soup
- 1L: ₦3,000 | 2L: ₦6,000 | 3L: ₦9,000 | 4L: ₦12,000 | 5L: ₦16,000

### Proteins (Rice): Chicken +₦3,000 | Turkey +₦4,500 | Beef +₦1,500 | Fish +₦2,000 | Egg +₦500
### Proteins (Soup): Meat +₦1,500 | Fish +₦2,000 | Stockfish +₦1,000
