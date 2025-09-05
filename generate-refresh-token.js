/**
 * Script para gerar um novo refresh token OAuth2
 * Execute: node generate-refresh-token.js
 */

import { google } from "googleapis";
import readline from "readline";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3001/auth/callback";

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

async function generateRefreshToken() {
  try {
    // Gerar URL de autorização
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent", // Força a geração de um novo refresh token
    });

    console.log("🔗 Acesse esta URL para autorizar:");
    console.log(authUrl);
    console.log("\n📋 Após autorizar, copie o código da URL e cole aqui:");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Código de autorização: ", async (code) => {
      try {
        // Trocar código por tokens
        const { tokens } = await oauth2Client.getToken(code);

        console.log("\n✅ Tokens gerados com sucesso!");
        console.log("\n📝 Adicione estas variáveis ao seu .env.local:");
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);

        if (tokens.access_token) {
          console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
        }

        console.log("\n🔄 Reinicie o servidor para aplicar as mudanças.");
      } catch (error) {
        console.error("❌ Erro ao trocar código por tokens:", error.message);
      }

      rl.close();
    });
  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

generateRefreshToken();
