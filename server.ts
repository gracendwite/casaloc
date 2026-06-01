import express from "express";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "casaloc_bandundu_secret_key_2026";

// Initialize SQLite database
const db = new Database("database.db");

// Enable tables creation
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    resetToken TEXT,
    resetExpires INTEGER
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    location TEXT NOT NULL,
    image TEXT NOT NULL,
    userId INTEGER NOT NULL,
    userName TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Increase body parser limit to support Base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Express route logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware for auth verification
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Authentification requise" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err || !decoded) {
      res.status(403).json({ error: "Session expirée ou invalide" });
      return;
    }
    
    // Retrieve user to make sure they still exist
    try {
      const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(decoded.userId) as any;
      if (!user) {
        res.status(403).json({ error: "Utilisateur non trouvé" });
        return;
      }
      req.user = { id: user.id, name: user.name, email: user.email };
      next();
    } catch (dbErr) {
      res.status(500).json({ error: "Erreur de base de données" });
    }
  });
};

// --- AUTHENTICATION ENDPOINTS ---

// Signup
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Veuillez remplir tous les champs" });
    return;
  }

  try {
    // Check if email already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      res.status(400).json({ error: "Cet email est déjà utilisé" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = db.prepare(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
    ).run(name, email.toLowerCase(), hashedPassword);

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });

    res.status(201).json({
      message: "Compte créé avec succès",
      token,
      user: { id: userId, name, email }
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Erreur lors de la création du compte" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Veuillez saisir votre email et mot de passe" });
    return;
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any;
    if (!user) {
      res.status(400).json({ error: "Identifiants invalides" });
      return;
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      res.status(400).json({ error: "Identifiants invalides" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// Get current user profile
app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Forgot Password - Initiates mock mail flow
app.post("/api/auth/forgot", (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Veuillez saisir votre email" });
    return;
  }

  try {
    const user = db.prepare("SELECT id, name FROM users WHERE email = ?").get(email.toLowerCase()) as any;
    if (!user) {
      // For security, don't explicitly say the email doesn't exist, but we can return success with warning or mock
      res.status(400).json({ error: "Aucun compte n'est enregistré avec cette adresse e-mail." });
      return;
    }

    // Generate quick temporary token
    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits token
    const expires = Date.now() + 3600000; // 1 hour

    db.prepare("UPDATE users SET resetToken = ?, resetExpires = ? WHERE id = ?").run(token, expires, user.id);

    // Mock direct reset URL link (helps the browser sandbox access it)
    const resetLink = `http://localhost:3000/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    console.log(`\n========================================`);
    console.log(`[MAIL MOCK] Réinitialisation de mot de passe pour ${email}`);
    console.log(`Code de sécurité : ${token}`);
    console.log(`Lien de réinitialisation de test : ${resetLink}`);
    console.log(`========================================\n`);

    res.json({
      success: true,
      message: "Un code de réinitialisation a été généré avec succès.",
      mockLink: resetLink, // Send back in the response for demo convenience!
      token: token
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la demande." });
  }
});

// Reset Password using Token
app.post("/api/auth/reset", async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    res.status(400).json({ error: "Veuillez fournir l'email, le code de sécurité et le nouveau mot de passe" });
    return;
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as any;
    if (!user) {
      res.status(400).json({ error: "Utilisateur non trouvé" });
      return;
    }

    if (!user.resetToken || user.resetToken !== token || !user.resetExpires || user.resetExpires < Date.now()) {
      res.status(400).json({ error: "Code de sécurité invalide ou expiré" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Clear token and update password
    db.prepare(
      "UPDATE users SET password = ?, resetToken = NULL, resetExpires = NULL WHERE id = ?"
    ).run(hashedPassword, user.id);

    res.json({ message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la réinitialisation." });
  }
});


// --- ANNONCES (LISTINGS) ENDPOINTS ---

// Fetch Listings (with filtering on location and maxPrice)
app.get("/api/listings", (req, res) => {
  const locationQuery = req.query.loc as string;
  const maxPriceQuery = req.query.maxPrice as string;

  try {
    let sql = "SELECT * FROM listings WHERE 1=1";
    const params: any[] = [];

    if (locationQuery && locationQuery.trim() !== "") {
      sql += " AND LOWER(location) LIKE ?";
      params.push(`%${locationQuery.toLowerCase().trim()}%`);
    }

    if (maxPriceQuery && maxPriceQuery.trim() !== "") {
      const price = parseFloat(maxPriceQuery);
      if (!isNaN(price)) {
        sql += " AND price <= ?";
        params.push(price);
      }
    }

    // Sort by latest first
    sql += " ORDER BY createdAt DESC";

    const listings = db.prepare(sql).all(...params);
    res.json({ listings });
  } catch (error) {
    console.error("Fetch listings error:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des annonces" });
  }
});

// Create a Listing
app.post("/api/listings", authenticateToken, (req: AuthenticatedRequest, res) => {
  const { title, description, price, location, image } = req.body;
  const user = req.user!;

  if (!title || !description || !price || !location || !image) {
    res.status(400).json({ error: "Veuillez remplir tous les champs de l'annonce" });
    return;
  }

  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    res.status(400).json({ error: "Veuillez saisir un prix valide" });
    return;
  }

  try {
    const result = db.prepare(
      "INSERT INTO listings (title, description, price, location, image, userId, userName) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(title, description, numericPrice, location, image, user.id, user.name);

    const newListing = {
      id: result.lastInsertRowid,
      title,
      description,
      price: numericPrice,
      location,
      image,
      userId: user.id,
      userName: user.name,
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      message: "Annonce publiée avec succès !",
      listing: newListing
    });
  } catch (error) {
    console.error("Create listing error:", error);
    res.status(500).json({ error: "Erreur lors de la publication de l'annonce" });
  }
});

// Delete listing
app.delete("/api/listings/:id", authenticateToken, (req: AuthenticatedRequest, res) => {
  const listingId = parseInt(req.params.id);
  const user = req.user!;

  if (isNaN(listingId)) {
    res.status(400).json({ error: "Identifiant invalide" });
    return;
  }

  try {
    // Check ownership
    const listing = db.prepare("SELECT userId FROM listings WHERE id = ?").get(listingId) as any;
    
    if (!listing) {
      res.status(404).json({ error: "Annonce non trouvée" });
      return;
    }

    if (listing.userId !== user.id) {
      res.status(403).json({ error: "Vous n'avez pas l'autorisation de supprimer cette annonce" });
      return;
    }

    db.prepare("DELETE FROM listings WHERE id = ?").run(listingId);
    res.json({ message: "Annonce supprimée avec succès" });
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({ error: "Erreur lors de la suppression de l'annonce" });
  }
});


// Insertion of initial sample listings if empty
try {
  const count = (db.prepare("SELECT COUNT(*) as count FROM listings").get() as any).count;
  if (count === 0) {
    console.log("Database table is empty. Inserting nice template listing data...");
    
    const sampleHouses = [
      {
        title: "Maison,moderne",
        description: "Magnifique villa de 4 chambres, salon spacieux, cuisine équipée, grand jardin extérieur sécurisé. Idéal pour grande famille.",
        price: 350,
        location: "Bandundu,basoko",
        image: "https://thfvnext.bing.com/th/id/OIP.3kcOvE1PwzCZI8nLX0kMGgAAAA?w=269&h=180&c=7&r=0&o=7&cb=thfvnextfalcon&pid=1.7&rm=3"
      },
      {
        title: "Appartement ",
        description: "Bel appartement meublé de deux chambres, salon lumineux, cuisine moderne, climatisation et eau stable. Quartier calme et sécurisé à deux pas du fleuve.",
        price: 180,
        location: "Bandundu, Quartier Malebo",
        image: "https://thfvnext.bing.com/th/id/OIP.Fi-8kwBrjnJjCWq0AEj36AHaFj?w=240&h=180&c=7&r=0&o=7&cb=thfvnextfalcon&pid=1.7&rm=3"
      },
      {
        title: "Maison familiale spacieuse",
        description: "Maison de plain-pied comprenant 3 chambres, douches privées, forage d'eau avec réservoir, raccordée au réseau électrique principal. Clôture en béton intégrée.",
        price: 250,
        location: "Bandundu, Quartier monusco ",
        image: "data:image/webp;base64,UklGRmojAABXRUJQVlA4IF4jAACQmQCdASo4AbQAPp1Em0olo6IpKlPM8SATiWVswYAFG08ZuEpf4p/S9+PKZXgzMCa5egdfven+V8D/7H21+0H9p8RF7/55zGvA3otzaPt9jM/IdEp4Cv3rfn+j01InGgKu8V6d966tbVFiqNwJgb7VrHwpVWSkLgAm1EvN2MlT0LIXmkywhXwdSvIrYvtkqCILnrhjVcvDnwoZWbd+4UBbhnubYJ98AjCdUywDQ8XFv/PslD6xWc9U4Q5N66FImL1+/9NKLRYHRcDjWkqtqPzfii3VG2sO1pB5CLckxZeKtfHUji5YSgRLXQWhJxASuoRgPPi3C8L2nTXmVX60UUOxUVObVYgEuSCnmg1yHQHaiEZ/pHDafB04ylgpC2gCubus/SkJZxYx3UtRMzGGQkGBzvcHAHb2DCp4DNMzMagIqNQrY0m6kOTefOUDELXlftjMxbYnczYI9FY3+cNoqR1AHIObx4qPlCVNDsxXPuVeu/wentHPhqJBPcuVjUWxztvYeRV7lXTcxHMzT/kmjKYa/8WI52Gj978+/azGlhsS5VnGm0bqQBtaYqaSmDi7bGeoN27pxle8BRA8CdiMkRwmU18g83AwyHzp0rHMcp1EdbZbcmvok0Oug+9b4adR/q19DsjUHLuNpgEedINyIj9Dofv4nc0p2VAB2PPc1azUAfLhZVTykidz6Ou0rFRYn9Gs65RYMarfPoDAGxygVTrMi+E/Wgiws4eAKlOcE1nnqQM43Ijairp0UyjkkA0mKliBBc5Ar+2m7CCblLe9l9MMOrhdaXkYVQRTxO+guabmgtNoTC36RW/YOsP9eLHxBIBfTpOeYHVZBWTkn6PxY2MECbW5Zz569zlemmRVPa2/hiNskTVEbGywosDTAau7dDeW4WZMnKpzxZPRDnbexbyBWMcJbjqw7oXNw8skbv9xeGVED70+TDZdMrd1eSSnKiP33DP0UXBHebZhlhFcYGA/0z5RvZ8Z4E+/KkEDWVcUEObztnGSYFn97RnueyVD7EyhM9z7WixrIb9W5+TQGHJvr4e5q7+UND94NEy9pH7JJL9t51M8cGkWfFzWiMNX+RMetve6POwhH9xHkr7ABKwmyBsIe0f2d6Q/pPI9FpEpcKFV9BonI27iXGp8/02HBQWyakTqXdMx/tQ9nv/WdyJgW7qrnIbXJ6v2cx2RppUvyioIpzJVGd+6waHh/P4qv7wVj0+CDayJHvxkTD0oiYabfbiioKtapZGDJTxKbjWLpDnp8k2wPwrWLQBXW70wkcvvymdPV1AG0aXpsJfmlL7A6swgkMEgVud+jVzNjzJIoEjE39UrUnm9rk+NaFXNSRESbnDiPrUyiYn3gN7Mzwc0j7neBLGxcROntIt3ZJ5sBXUo1fGyhSVbtMzNnMKy72aRJznfrTPmFXHkUx75B+VEIXLHEkHa3Kq1B5nI3F3i2WK+t6N3aRL2p96YNEDTf2lzQswAlz8E8E5fqhRF6w7gArr992niSnFVcr/RwNPfSUIRcbliEdggvrP9oGRt6dssrITSagb2RyiwZq+IFz+0vG5PnbpLKR896QjJMIE+kAM9yvmMOx4L+Vt5GfFnm2CG8U0jrZku/U1e/Ttb2ukFFxWiZsFKSeAX9R+hkx7j9Q3MjmOQAP77rWdHxoAFwReWeDBVQN0SNZ/DxlLGcRJIitcDeWXVrB3lsOpXV4oHWoe+9SgCVPhxHCRUIC0chIp+MjjiCq0p5avfh+zHOOOfSAzBQwlgfGg/1KM6buwfn6pAnppXNg2lv7CBx3rpi0EPbMBLNTjX3GUNURvz0iB5EAesthWOpSxFShnEuRnWryaYrUyehb3AeJ3sGikVc9z8dUQe5We91b1CsV3J0R2st7kh445cNfaK5iTL5Mg9ZWZR1vLeNJFZEcLCfV+bq4YddUHtcnsuIRdAdHH9e6g/7Vd6MoNv6WB9L1sOBH0jaf7ZyRlAK9WWjsw4Dyt/SSLBmBN+551MRHOF8BYN1qIdxfX7dOdWqknoi3b+ZzTL7b1kjLD3HaJGBRvnkljT+PjEDhFsRbBGULcX4yswDXJwbAvErUpTulPUd+R7TEWLAH5JsPOB97N82ZKowCIKK+BNe5hrAI95HHe+EMcEB+faEP/lrPKRLWqyLa/MoZ/VYV0I4LehGL/VSInSJ7MTBs5aokkU0AGAitQ8YrLoombJSA7s7Bz3Lp18SN3nHkpthpyt4u+o6XXW0uZAxfzpHBb46KGVT9jnyjAToqAThCH4Npf6L7UuaIaGGhbBjK73xNuZvq1Z4YIcDnwaPfCYAI6X0pS3XvT5qZJ4kq10y2PCS9Qxtf0t5IqzjM9AdBvBv3K0UiEfLBxaU678dc2IZ0LoTVLlPNydBNGz33FFhS/hAPEtkEFADISWcm7S5CFbKHODBvIWcuxPlsvCzN5s83LVYSOwqIyMmtmEArJT1UYKBPUDhz2JIW1cDApaz3IYHKltPQgq2MQ4+KG7ZwTRw/TQYpivVNIBAcN4b+sJr5n8vabpUi3cZglDNMBoAxrlem6b+ec/geXdFkDeA9pZSGqwufDktbXQXPcglVWksB+/i0ahAdNE+XFX9vJN59tpiazEYmk4Y4e6jBsaUayUGrKHfNfvCTkTduL94eJMv9Ar1BeUh0iPO0LY8VPRti42Wgv7SQfmiDHq69ANdPD/oI6jsysXlEzTXBMxwjj9a8JE4UOqU75pQMRGQdr4xPi42C+/bImVnPAcCDx//8gTTlJfw4oqhvTyQ93t3VQj3VvER1pH/bTtMmLg41z8+24kOxzj/oDOweRPIt1YTKilLkcpXS2ctTk65wgHCYHpmssQnnJ2QeeRlP5C/paV8di4T0J0/NevtGuCRI5c0a0d7eCUgKA0PwIc5nUgET5INb5Kow/m7/4Ja0qY89LtKBzfeYNRXwQgWINGP/RF9nAoID7c4+68jcQ7dyhX4jekuTJDfrKamlkcvnlDSx4UkfhqlE56h0OpCT6hZEo0ryIQXhNaFJK0coSBAt0h/ZGdeyXu7i3F9GyMr0gWf0ndUnuf8qH9nHapphz8gedzxycjWZCIzzvINbzRGyiZtBGVaoS6mLLOOc9azkYW2KWCrW99utnkqaEeCrRvkTGJ3wCa8+4f0IHJXcMfyfjEcHkOuWL8BEfRgYdeAbZZvu9ZTMy9HouB8xIbOCL1RorQ8lQRusd9Sdvinh7L5u45Y8/FqK8psFI4PYNM6Hk3eYJ0AkKjwmTltUD67cyX3ypzP02K8uxV2+fUqOKlD7naQqUcTsNwaMLa2b15OzqaNmtM2xjQoVqDN26CNSKptBhHBF6Vnt/OUlxhG5vtlUVofGkAZtaR94yFm+vAbAtJJnZ0JoTDr0Rq30mlprqE5DhYXisdrINqio4dzN38OQ0fZyB2QOwqLnN8a5r16Wev2oF/uawphcPBg8KGmhnDu38aEtuDWBCI9/VtnQq2Z0yOZthF5Ei81q7K1VmHlC0VAfIZa3H0n9Y+frgvZLWSL1HrAL8q5+4/000IjtDEtqvM/RPwY5dQqlfy9f6d6RPg4KSyuH43L6Jl4WAzPvtcfWyKGU7Xp3AeKiQye0sAvIlvfesxqTgXbdYTRHVA2X7HMt8mxCzKVLD2CxAKvP78/eZUJM+FAy4MMsadfp9EZ6buxFxwZSn63DL94vtjOosY6NdaTZUourvI7XQN/Ad/iwBE3UERh75tNwfjHvXf5c8CRZQnPv+S1kx03r+qBx8+HWmOh+uRiZCuXsRpV0YXK3wKIUb3Nk8XTGY2u8cxMDYf6cOH5Laj+4czQdpIidlqFLVOohP1C+ebrUAcNhwh0XCdZNEmXm0ZbW3/G/8bqsTiAjTem6U0T4ijsIHOEawzNAJUSvG2MUvjrG4WCt8CwX5aNBeq+vZcreF/kZcMAd6e2IOWqfWXxMohndqcvDHW3OB2qZON8Htx2kEsyVyjbrzsfEGR8E2QNEpqk2p9m9pTt4xpk0h4FP+PYvP+qR7IrxBurMz6j9ugWl5g+6TrrNugdtWfkRvYI1hMV/I58qZzrPqfMuHzILc0N31By+IixK2bJklBktnXNfv/OW6QiDMhwakbZMBtUBMCHsM6xK2SvnveYLiGkSdcxmoChYc1yy57/BLoIcFSMs1bGTH7QpxNltDTO9ntPG4lUoA7IECS2Wt05IUvxRH8ZRA0/egDaNrBezBJR4zYqXXRNGm9okFiJ/uUbiLZCVK4gcfdCyq63Y7a4hKsb4ESWkuVKAX4BNPyXKKGHlaloqCrfAucVcRh7+T4IFolwPXiz5V5eDljQ9Qf9uewYgFLAnn5432hg3s+CsnpJFqPda85X9n5CxTaXqfJ9Rv5r5OPlqAj8RnPhVi8//7SHBH2W3vOHhR8l4KAjNqGUJ1/zurM9AkW9+2LLZAlxdbcjor/61w3azbOKwXAz/IqqQ6t25teaREV9FI5VMsj6JyIYuZ/BayN6qJ4vu8itHrfZeWeFGQwNKrT/vrDEEhbBCgNij2lFNUe7B4mp52uil6LwoPgUdFBXFwEyKuDcL36CI2hqsQpuJcJ5sQo6qD/rsEezxbPyxgt9vnb6QK3X7baQg7b+s+v9jKcaUjn/6aHPr50h4hfjXQj+PSd0Gb8MYURg38poE5ZKLYvJHVVtHPv7VcQJPGrb/g2lN4pGmfN8ggZ/WX35jTFRyz5RupF8CNBU0yk9A5yMvDaXNqNI+SWAn3FUJgpkyTcGPG7q22t+R2MkRPnCoTPZ5fM0yqJXi8WoWykzjEeZg1/WoMt+LjbxbBA10d+bKM5X6NbCgyV3aJ32txhJVWPe/MaUGCmBWWoAi+U5qWYho/ZKLBmy3oUW7gzB/bl2tPta9BHonVrJcU6HPwiGQqDZktEb6ShI44xtCWnwTNH6H56ly4S994s7dwu/ieWYF6dS6Rh1ScTMpHfhrXsNrNxk7VN1JSAFg8+8xOsEzAAAw6ZA265/1XmZg5r0vMY7nnYA6VKv/WPs4STAO/PHrK7ScoWJg4ZHzLDT2d+Kae7WLhDwUJZBAjdzqtyZP4FauyZlzj5bzmaDYN30mkuNy3UCZI0v6fsXDBAkzMV74vvECWFaHxq/9BuwuoI+JdE05owa0+qhQ4/AXCrdHR5ea9LXreq2NsqVVmjqLr5i5R/qo3Y8e9GJxvGVLMetgs/eAcgexgXDAXMrW5G0D3uyO3FrcLYBZsrlWth07v275u6bRJK/XNJqQ1q96rZ8lqC818fxQZ0hYyH/tSg19xUnWtOLeCT1NMM6xFKbfU2q1ZmxgKfyqJQn+N/gkeEpbnSBziutgu/yxFk2H5pqw1hKXshfTGAIC4uPK/FEcG1MHYWdO/d2L/q+KUoAyWfnAhHJcEOpcfP1I4BEA154u3YFk3RX3f1LaWWRGwghUI3uLwgoZS+YLnufoSXZakmRZrLsucxFKXidzrSdylQXP0RlYdEtx/F+zAsFzXLtQ0pgxq/X+Y/qXVDkh7bAvYdoZlmB+4Mdz1lQH1R4JLFd9TyQXWVtqE7nGXU5FX/6yApIF055MoD8XTjKp/Eb1tST+2rm157Lcrh11fT7ePl+HJoksL4mNVT+BlqrB5y8QdUC55JKzi0oJQ16iOCRY+93KMmd9G0GtO4Mhni8lHBSPjS5N22fQmx2iWLR+0quYqUIh86PCGYsSZyfUsJGCCQY+7TWZqOtxsvVmFheKUGrKA2UeXyzNbIg88GtBKl3W/5pmQHXPzdQgMunai0ddTs2EkDRco39VzMF719r0jADoR2+65bmJYaL/qe9PAmS2iLiuYYJukGobeKkMYnjRKXM+hgywwfBZO0VWXuTm7IuLMARDF0NbkO4UhapsK6x8l+EnEXS3bvu1YVFNVH6bn24VsUDqHRr/lwMDSQpLQrV+4GCNacTDSIHU6pXl3ADhQzEKfhsuIejZt3yYPYQ1IHLlVRX5RDjogVspRLGYkxUeiaARd7XFUmREGpVx7+m/c6petmYAKXiTF1v5Z+8KYN504pUQSXWAfB/7sMgSL9j6S+E25+Z8Ubpk5zpCK+GITIVEhjBRBgk9upumIivAf0+GHW1N4g88ym62wuorg5zIdRHHsx3keBqddY2HEqHk1qzv4QE3fRaE8yBROm/pkqKtcCrFaM1Cm6GDpmpr2rRZk8K3OzYYoKcgTBsIc/WrY9Y1126beQw+bZGu2AG8+Y2jhIvBSr9Seo13imhHV6wbbsLmlWJiXcRIDHtNe3YOJWR4ICMfks+24Pd+DqcEJJlvvctRnaL2TgN5jtsAOMRMArpOcHgPXu2jeEYFJfwE0U6FENb+UYKjoLN0BPGoynJrtGu9pChshxLamP7ABnDhX5Oel0C70tJZofOABaxN7ZwtJe+ewR4us5waVZJ0zRtNEinbdy14wGkYfDMCGGBFBAz+8xvFlg0lkmQTQ/VLTg0ST3VXTTgk2fstlCJ+MQ99Q82+MvsyHYyBsionkiXm1hEicG181MOpVCJbnLcKHho4p6dlVf389SMVnmrHzIn5tbAezZDMeYiQnko7om4iFZyKSE5Ea0Afa79efuvs1V4E2qPQoV7rgHPEO0MLIe+a7pnNFcf3CfxRsnR9Eehit/q1VoJelZSTtcoIw3mWz+R8izriBW89bA6vZINnXKG+4CXZGaVWa3Jo120AJr8wilD7ixxr7Hel5uLyGrf2JhAU4oMIPAXy609HzPJvhJwfiW4hBGLb2BkJf3NiodIGC1tVjqqLxl284FyHuR+y9XXQYR6joBmyd+97XsqeLS0LAb0PtIGVWS3/fdSdu5mQVoTvO2aw5GBc+S3EmhcABxN8FI2CUOdxVpHSV+EocudzSQUBftWMXvMpMb4aMQl5wftxVdUge2lX/vZ4phmaLWmh65eoIzSngw6UHD4LNCh/KaPLs3XBI47+iCxC3RNXkc8xsJJDb0BvFi+cbrsO+CcAPFnZI7fNGOIm6Tm7Je7YvyxDC62GyWQuTwYWPzejheqT/1RB5+DQ6RF7yFSv0qtuUvJSN+KSpbb1pLJWi0bJFkfAxM2s6pRpybgidbpWkoUpX3VPBTr7DGPTPpvGlO2r4bpwYvVPKaSuOEFPDQiTWGtvSu7dyR5hXyZeT8rUq6cgnQ8WIdCIsscY9MvjgpfQuPX0krOy2LhnuwKAzH5ut+eM+3WcpK26yQCzxGZIYqVuBRid5yrDPNfn/2+PMeM1paLp8ZImSorhpjM1GriTGnQTEP5T1xDuk0E+tjckyHilX21S4O5nMj0RHvz8YtC9F+m6PEVN1Dg/fWZkU+SwimLy6koshgdp5NbqX2CRFlcryeUUcZ10UVOoa7tafkQxoSLgXMmLpw9TSW1+XS/FDKARA7JmK7sPmbo9tyKgu3d4M7NRdRCRPX5zLh5/HUq1fUeC6+vTOORWHPi7WDlmIaoBUQKHUh+PSb644nvmnuc/2LJHgWo2AK4L4GEvPmVdv5Lw9Uk9oUqy5GbFUWA0sWxJI50oMFBQ6KVQNyXcOif0CiPXPEFpPtNVCXKVWZQYz3ZmA9MDXPYtcxfZUNNeATLkUFXJJAXYEdNwTeYFEom0iwsYPpkwE/10pha5r0G71IKZGHUVQKl0/rKjXBgSlV2kOAndGBR/YwUi6XeP5Xk+CmUAZsg6WkfJFEw/2F2YAcxddYqPOAsfxjf+24bI9etYEoTD0UeBeQsDhaAqKusOJJj1I27yX1uuJTsGZG0FMAfKQgrZNy30RqgPr3btGtIVHPVDRiMwKyLGCzZFiQKqPG2rVtVltPGbhDoH5Fa3Pq7oQrZp7j+586rOVyLQN9hBobHnSH6VT/VVh62omiWvIzuuPs5UyIw6V/sQqCOrKnRG79AsdOB8gT0MjCOJ/olk00Vt+1r7xPz0gMMyjEB8I7CqOBNVe3pV0ycn8aN8VSdezEkk1KDCG9598Cc4LSgs5mlfRIPnZu6JKBMIt7CUM0lkVp9PfdPjmodgYbIjv24pgXqGu60Z12qOa6nFS0LSttdeAiErk8gdm757B6Xp92N8SBx7oKDN3QWYaB134GmtY4q/Vd3r8VRP5HwqT2mLdlg/Q1WORzbSByhcMezQJbrgDCVfnmLzzf1O2FlgUbwJpY3PY5W4JaovImT6OZEs8o8QTNTZOZi0XDcyZ/DtcCfNXQy6O5WSQzgcKLspS/Lwb4x12kfEGpnPVmi0h1p32+IXz9smPryvCblFzQJlBok8GA0JJTJc6IcgQ/TCGODpQn5yfHFZsaSjWelJiJ+j8tQK0pWZJYdGqm8F8L0NLo+75iYeKtWWM5/6L9TkrpqMPxeDEqJnJHN6Bp6mModt7VKmJEwgO2MlcaNife9KaUGsuCjCSMebAqPuSVr7tw2pddbeiNaKjoaCpB8wNFEHRczXGXmKXalAprPIDernc1rMER5OjIxVyEsC3/kUmVKloNklc7smGEl/+bIvVoa6AVgAYRyJChwxO1elEALAEH5+aP0qpnOIssKIEKaXgeaeyRU6yxtyXTIs1Dp1PVJdnLPLT+cKb3VYOLMJX6jh8HCc8Bxa5ZSf7kO5t6Z1zMrhCHSVFjdmx1RMsMzshRUb180JNZ3nwLjM551CCg4vVMuKNfN2c+iOpyPJUPlKEmhwB76HUDcpBsX+q3fnG+LV5dZqr1z5r2pnD5mWvF7t/ZGuJPxZElz6yj2oUTiVP4PzQkYL5DoyzfiVN4GC5tBGz2KNBBLZpES23HAr5kRa6lpaUhDQpAN6xS0CAR2i2rDNUS54Q8TVZTWWvgJCBYeQQgtbkdtGsdmjCTu8tqmz6XHv1QA0IV/k13T7CNiqjlbuKAvyKBsYNQjibZ3+t82FQmD95n2foXYmp+roIhgXq36TdJKkP70fvBJGf9C4IxHraFd3JnxcTDLvWo0FL7d+vSKFiAz7uUq5rJaw0X0qrKWFnPXbB81KCI84iMA7JpUe6oJt98HUpHV50qrYL0RyoJewTlIyXVlmV8ZqbFHGXc22hk/NDXMiP6iy1bLUxk7+vCZ7ACbj4GLrq4SW1GeByN/SJYeGBGzZL32/Hy86n/L1OYWRc+z9LMSLEO626TpLoRzHwmAdtE/8e+LTD7oaUWrRuajt1qS3kB5zu3kAGTQiyGvxDIbyqoWkcI9wkqgogfpliC9mwTXhG7Mhks160X9paKdVQad7PmtVFK5jM7TFG85q/X+QCoBwR9clGebGBPgw6m7xwJ5UU1MSh+MIeWTBGqO9wylW+SUkYK0DVwAY5PN7YOLeEFOMDkrjLmLZAPYGBa9eGFpMoeDuYnx779EEt5n706q4+KLXXtUrdo4dLminD17YiHk7GzS1LY236vR03REzZ6j0hCpcmZX3d3JP0FQC6sKOyZ4xCKl22bMTOUn0OSICN/9LXAFRQdB9MpK0QTRLjQsL6slmJE3hTuyiqGGkpPsV/K0CGbLkaqkt9ERlEAayw15mvILiCatd/sZhimjwplZzLQUXrSrxELNJryuavSTwaQF1w2HIAxBM5WBfirczJu9B68gLE0eW4EyrJZ/o9niuuA26aFuosyklhPZoKPxmu5xyDBdk7RbgJdcvq06ZLf7HwS5h7yeKgBk/+LZ+pZY47m2+XeBy3/QqLWI7kkH34S8uHqF45N3D2s7puAitQgHB/t6QQjLuWajhnDGvTfv5c1E+PgMbvfsXtCxwYcD6zbAHAOCXRWQfkGBwsPQ11wzxXCVliATLtUZYnt/ZBKoVksNO11sbhoNh7vT4At6c0rwS53KOp6uMO990YnHi7c3np8I6to3XhouAqkHTBcfRNaEsQLbfLCkQ3gk3ODlNZ+KuJoOuLPtkeGZMyLvwx/TTTLZxEoytTKltrZbJEJPlz8PxjQsLJzn8GGxrQE2wpowa3S1tmbZ/ibwaaHalFQjD/LnTLHLqQ9WFu1rdXYZYR9wM1WtkgVo7rQbJzD92Q28F/N3bokVIaYx+tNTiMVGrUt7EwMi1+Ctg3L602Q/F00AJpKzacaOumz3rqBI2NvMxWhNHEguF0PFQ1kxj5i31heKaqmM4Xrv/ESvMVNhp/Sx6rDMn9QAkI0qH6TXSIg9hF2W3CDEFtUc5014Gfum3XuhQp7fpN0UTy3t7UTfFWc7mN98Zc7jm+SlE1ttxMDjFHUoyOIGkwleFNNrwvQY/dd+Gc7pfDiTo/tOHx+onwXG5pZkDmC5KI7IVehctKBZU3MrR6/79KXtb3nyQkrsbRnbKfmV7kux+yYeq9IVzJeYo/KDf9/Hieo/bXlcQe6R8PsgyhYxOnoamjh7LXV7NUel6K5BnG/Epbp3nM4WlnowZDksV4+otgD1uVT4CugSIm0zr9SNvu+6DLmjX1fQlX8dgybqKjRYlDZAqXBASJce8CyuAnPSwPVqZxlOrHlPedLyNRiD+4LpQt3YZWQLC5cZKImGssg2pTeABnhLRojZ788v/dPkApqr7zZfa7xv+PvolLFyJh5fNnnxF/gXN4f+cOuFJ0/Au1BhvhQo1/YvKcRzj0RSidOAjwzA4ZkbrzCAbEYAfSuNkezfZY+YrY7bUiUhCX0QUdu6NpRimEzMTNBrrcJ/BdZ9YvE4RJu6EfJzchD5fxPqYcX4jv5EKmllVrnlEOyFloj7b02oIdw4K7nm/3sWjyG6vIIJjZjNQUdETcrKhCth8KcT8hNfrFAm/aa8io28zggtGJHEJeDqNGDXyE7Mrx/GPSbp5wAZ8J48DDodC68dx4HZ1r1CaK6WNT5UuufU19Mdta7gRMzdfkHovUNboCXSqhrzmhc+tn18CTX0Z/HNGD1MowwNCZE+E7SVPJdJ4NEBUKLNVgPcV7yls99Lnkhd2sktGU6P0OecPeARrlNJHv12scclKCusYT8ZdfKN5NxORtRJdKXk0YdCSSA9Xbkv2ho/3Sm7+4SWBX0TPKrlQZULvdSxJRBTmjJi8PAdg60pD7K+8Q+kUY2vYpe1Zm/dhCL4t+U+OOUsOAHF7FquMDgza+nlzKz8clAMxYfwkL5MKFTpcZwgxhXyYGIPL7b/168/n/bZjnOEtIFuwOHDdeNLaxISZhpSNFKzbQ/VC+NeDWIZWIX6AWd2oxmJ0YWB+2cP7RgVcogL9Jy0jOwlnBZCkl+BFMzQ0alvFfi+ir+uBmvI4Lyajxtx8yjgGliCBl9VSLuIx7gEvYEmMF7et9rD/Re+jeE3KIHs35DSzhL3AlqLX/Dy6ZvwKn530pKvGRO/lx2EerNeMVOebNHtEj06FEzki4OdbGPysfJXnPYB1cC/V2NduPDMdAriYMNgKsEaac1y2kqt4A+JLJZ58opS/rxq65YAuyz5KwGrFf+XoHqttl1bowjAjKBcVq3KWNPkgrlM93X1XHaRIxakNlNtXnrSKp0saG7iMlFpgQHe6BF+7P4qw00wD0ZYZ1s0xVIuiy8w0bTuZVeuzllQ8KPdbjopseezFT7nZB96f4a92IwryoC0CWuSuR7vgLpzwsI0QBALrlaWijVJqsFUuIOm8JPnTlR8piv8LKOpMYuh/vvlObS3QzqYf8ugIMXxYY9QhdG5qd9nHCxV8MJMlKncNI6V2DicILUY+1mk4SfQ+IhEIDogwAfuvAOdAzpyj9FNq/7geTsyILG+Z3D38yZCnrsBPQbt3T+t+RwD0K1kGK/zpjkyrR8Itf5FGh68DExiwUNldrP2mVCSEryKj3T4giUQWPgcE2azGenN7AjsDeLcm9x0j0XLDjSeoCG6zAmoYtzUAFPcxu9q3pOcC1y9ysfmRSqoSWSaIBJSTCG0WMHIL7fyrGL+vFMZNCqu+SvUdwgUXfQR5rPaHM1QLyq+qI5moHS6XB8LKAoi9j0YVLG+Ju1WY216PAAyqlsNrpp4x0m7jGEjCeGdd8obPBAB4Zapi7tlhKtjGG1e/5OODtUIIiKzTaNHUWHMTErgpYTKOYIWySt3kB6RtgU8ajewJ5vVClWTSC0XJVqvOG059M6FPViAwUjYQHIhXENoyqgBNbRbT70DhVilukMJCaj0MzkF39RTxiuAJiIdp7YpgZJZ5Nme+aFowTmm70Gvby/W5BW5PBT5DAgdCD+94exPIq94DUS2+Al9MwAAAA="
      }
    ];

    const insertStmt = db.prepare(
      "INSERT INTO listings (title, description, price, location, image, userId, userName) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    for (const house of sampleHouses) {
      insertStmt.run(house.title, house.description, house.price, house.location, house.image, 1, "Grace Ndwite");
    }
    console.log("Default listings successfully seeded!");
  }
} catch (seedErr) {
  console.error("Error seeding data:", seedErr);
}


// --- SPA ROUTING & VITE SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // In dev mode, mount Vite as middleware so it handles the front-end code hot reload and building seamlessly
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built files statically
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
    console.log(`Backend server ready for Casaloc application!`);
  });
}

startServer();
