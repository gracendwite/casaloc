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
        title: "Villa moderne avec jardin",
        description: "Magnifique villa de 4 chambres, salon spacieux, cuisine équipée, terrasse, grand jardin extérieur sécurisé. Idéal pour grande famille.",
        price: 350,
        location: "Bandundu Centre, Quartier Lumumba",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Appartement cosy de 2 chambres",
        description: "Bel appartement meublé de deux chambres, salon lumineux, cuisine moderne, climatisation et eau stable. Quartier calme et sécurisé à deux pas du fleuve.",
        price: 180,
        location: "Bandundu, Quartier Malebo",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
      },
      {
        title: "Maison familiale spacieuse",
        description: "Maison de plain-pied comprenant 3 chambres, douches privées, forage d'eau avec réservoir, raccordée au réseau électrique principal. Clôture en béton intégrée.",
        price: 250,
        location: "Bandundu, Quartier Basoko",
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80"
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
