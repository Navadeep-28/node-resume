import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  try {
    console.log("Fetching available Gemini models...");
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ Error:", data.error.message);
      return;
    }

    console.log("\n✅ AVAILABLE MODELS:");
    data.models.forEach(model => {
      if (model.name.includes("gemini")) {
        console.log(`- ${model.name.replace('models/', '')}`);
      }
    });
    
    console.log("\n💡 Use one of these names in backend/services/aiService.js");
  } catch (error) {
    console.error("Failed to fetch models:", error);
  }
}

listModels();