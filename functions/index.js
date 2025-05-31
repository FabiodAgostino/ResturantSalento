// functions/index.js
const functions = require('firebase-functions');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors')({ origin: true });

// Cloud Function per il web scraping di TripAdvisor
exports.extractRestaurantData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Controlla il metodo HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Metodo non consentito' });
    }

    try {
      const { url } = req.body;

      if (!url || !url.toLowerCase().includes('tripadvisor')) {
        return res.status(400).json({ 
          error: 'URL TripAdvisor valido richiesto' 
        });
      }

      // Effettua la richiesta HTTP
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Estrai nome del ristorante
      const name = $('.biGQs._P.hzzSG.rRtyp').first().text().trim() || 
                   $('h1').first().text().trim() || 
                   "Ristorante";

      // Estrai rating
      const ratingText = $('.biGQs._P.pZUbB.KxBGd').first().text().trim();
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      const rating = ratingMatch ? ratingMatch[1] : "4.0";

      // Estrai fascia di prezzo
      let priceRange = "€€";
      $('.biGQs._P.pZUbB.KxBGd').each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.includes('€€€€')) {
          priceRange = "€€€€";
        } else if (text.includes('€€€')) {
          priceRange = "€€€";
        } else if (text.includes('€€')) {
          priceRange = "€€";
        } else if (text.includes('€') && !text.includes('€€')) {
          priceRange = "€";
        }
      });

      // Estrai tipo di cucina
      let cuisine = "italiana";
      $('.HUMGB.cPbcf .biGQs._P.pZUbB.KxBGd').each((i, elem) => {
        const text = $(elem).text().trim().toLowerCase();
        if (text.includes('pugliese') || text.includes('apulian')) {
          cuisine = "pugliese";
        } else if (text.includes('pesce') || text.includes('seafood') || text.includes('fish')) {
          cuisine = "pesce";
        } else if (text.includes('mediterranea') || text.includes('mediterranean')) {
          cuisine = "mediterranea";
        } else if (text.includes('barbecue') || text.includes('grill')) {
          cuisine = "barbecue";
        } else if (text.includes('steakhouse') || text.includes('steak')) {
          cuisine = "steakhouse";
        } else if (text.includes('italiana') || text.includes('italian')) {
          cuisine = "italiana";
        }
      });

      // Estrai descrizione
      const description = $('.biGQs._P.pZUbB.avBIb.KxBGd').first().text().trim() ||
                         "Ristorante autentico che serve specialità locali";

      // Estrai indirizzo
      const address = $('.biGQs._P.fiohW.fOtGX').first().text().trim() ||
                     "Salento, Puglia";

      // Estrai coordinate dalla mappa Google Maps
      let latitude = "40.3515";
      let longitude = "18.1750";
      let location = "Salento";

      $('.BMQDV._F.Gv.bYExr.SwZTJ.FGwzt.ukgoS').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.includes('maps.google.com')) {
          const coordMatch = href.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
          if (coordMatch) {
            latitude = coordMatch[1];
            longitude = coordMatch[2];
          }
          
          // Estrai posizione dall'indirizzo
          const addressMatch = href.match(/daddr=([^@]+)@/);
          if (addressMatch) {
            const addressParts = decodeURIComponent(addressMatch[1]).split(',');
            if (addressParts.length > 1) {
              location = addressParts[addressParts.length - 2].trim();
            }
          }
        }
      });

      const extracted = {
        name,
        cuisine,
        priceRange,
        rating,
        location,
        description,
        address,
        latitude,
        longitude
      };

      console.log('Dati estratti con successo:', extracted);
      res.status(200).json({ extracted });

    } catch (error) {
      console.error('Errore durante il scraping:', error);
      res.status(500).json({ 
        error: 'Errore nell\'estrazione dei dati del ristorante. La pagina potrebbe essere protetta o la struttura è cambiata.',
        details: error.message 
      });
    }
  });
});

// Cloud Function per validare URL TripAdvisor
exports.validateTripAdvisorUrl = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { url } = req.body;
    
    const isValid = url && 
                   typeof url === 'string' && 
                   url.includes('tripadvisor.com') &&
                   url.includes('Restaurant_Review');
    
    res.status(200).json({ isValid });
  });
});