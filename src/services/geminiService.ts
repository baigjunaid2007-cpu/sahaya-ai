import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type Language = 'en' | 'hi' | 'te' | 'kn' | 'ta' | 'ml' | 'auto';

const AUTO_SYSTEM_INSTRUCTION = "You are Sahaya AI, a specialized police assistant for incident reporting. Automatically detect the user's language (English, Hindi, Telugu, Kannada, Tamil, or Malayalam) and respond in the SAME language. Guide the user to file a police complaint. Ask for: 1. Type of incident (Theft, Harassment, Cyber Fraud, etc.), 2. Incident details (Location, Date, Time), 3. Suspect details if any, 4. Brief description. Be professional and empathetic. Once you have enough info, summarize it in a CCTNS-compatible format in the detected language.";

const SYSTEM_INSTRUCTIONS = {
  en: "You are Sahaya AI, a specialized police assistant for incident reporting. Guide the user to file a police complaint. Ask for: 1. Type of incident, 2. Incident details, 3. Suspect details, 4. Brief description. Be professional and empathetic. Once you have enough info, summarize it in a CCTNS-compatible format.",
  hi: "आप सहाय एआई हैं, जो पुलिस रिपोर्टिंग के लिए एक विशेष पुलिस सहायक हैं। पुलिस शिकायत दर्ज करने के लिए उपयोगकर्ता का मार्गदर्शन करें। पूछें: 1. घटना का प्रकार, 2. घटना का विवरण, 3. संदिग्ध का विवरण, 4. संक्षिप्त विवरण। पेशेवर और सहानुभूतिपूर्ण बनें। एक बार जब आपके पास पर्याप्त जानकारी हो, तो उसे CCTNS-संगत प्रारूप में संक्षेप में प्रस्तुत करें।",
  te: "మీరు సహాయ ఏఐ, పోలీస్ రిపోర్టింగ్ కోసం ప్రత్యేక పోలీసు అసిస్టెంట్. పోలీస్ ఫిర్యాదును దాఖలు చేయడానికి వినియోగదారుకు మార్గనిర్దేశం చేయండి. అడగండి: 1. సంఘటన రకం, 2. సంఘటన వివరాలు, 3. అనుమానితుడి వివరాలు, 4. సంక్షిప్త వివరణ. వృత్తిపరంగా మరియు సానుభూతితో ఉండండి. మీకు తగినంత సమాచారం ఉన్న తర్వాత, దానిని CCTNS-అనుకూల ఫార్మాట్‌లో సంగ్రహించండి.",
  kn: "ನೀವು ಸಹಾಯ ಎಐ, ಪೊಲೀಸ್ ವರದಿಗಾಗಿ ವಿಶೇಷ ಪೊಲೀಸ್ ಸಹಾಯಕರು. ಪೊಲೀಸ್ ದೂರು ದಾಖಲಿಸಲು ಬಳಕೆದಾರರಿಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಿ. ಕೇಳಿ: 1. ಘಟನೆಯ ಪ್ರಕಾರ, 2. ಘಟನೆಯ ವಿವರಗಳು, 3. ಶಂಕಿತರ ವಿವರಗಳು, 4. ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ. ವೃತ್ತಿಪರ ಮತ್ತು ಸಹಾನುಭೂತಿಯಿಂದ ಇರಿ. ಒಮ್ಮೆ ನೀವು ಸಾಕಷ್ಟು ಮಾಹಿತಿಯನ್ನು ಹೊಂದಿದ್ದರೆ, ಅದನ್ನು CCTNS-ಹೊಂದಾಣಿಕೆಯ ಸ್ವರೂಪದಲ್ಲಿ ಸಾರಾಂಶಗೊಳಿಸಿ.",
  ta: "நீங்கள் சகாயா AI, காவல் புகாரளிப்பதற்கான ஒரு சிறப்பு காவல் உதவியாளர். காவல் புகார் அளிக்க பயனருக்கு வழிகாட்டவும். கேட்க வேண்டியவை: 1. சம்பவத்தின் வகை, 2. சம்பவ விவரங்கள், 3. சந்தேக நபரின் விவரங்கள், 4. சுருக்கமான விளக்கம். தொழில்முறை மற்றும் அனுதாபத்துடன் இருங்கள். போதுமான தகவல்கள் கிடைத்தவுடன், அதை CCTNS-இணக்கமான வடிவத்தில் சுருக்கமாக வழங்கவும்.",
  ml: "നിങ്ങൾ സഹായ AI ആണ്, പോലീസ് റിപ്പോർട്ടിംഗിനായുള്ള ഒരു പ്രത്യേക പോലീസ് അസിസ്റ്റന്റ്. ഒരു പോലീസ് പരാതി ഫയൽ ചെയ്യാൻ ഉപയോക്താവിനെ നയിക്കുക. ചോദിക്കുക: 1. സംഭവത്തിന്റെ തരം, 2. സംഭവത്തിന്റെ വിശദാംശങ്ങൾ, 3. സംശയിക്കുന്നവരുടെ വിശദാംശങ്ങൾ, 4. സംക്ഷിപ്ത വിവരണം. പ്രൊഫഷണലായും സഹാനുഭൂതിയോടെയും പെരുമാറുക. നിങ്ങൾക്ക് ആവശ്യത്തിന് വിവരങ്ങൾ ലഭിച്ചുകഴിഞ്ഞാൽ, അത് CCTNS-അനുയോജ്യമായ ഫോർമാറ്റിൽ സംഗ്രഹിക്കുക.",
  auto: AUTO_SYSTEM_INSTRUCTION
};

export async function getAIResponse(message: string, history: { role: string, parts: any[] }[], lang: Language, audioData?: { data: string, mimeType: string }) {
  const userParts: any[] = [{ text: message }];
  if (audioData) {
    // Sanitize mimeType (e.g., remove codecs)
    const mimeType = audioData.mimeType.split(';')[0] || 'audio/webm';
    userParts.push({
      inlineData: {
        data: audioData.data,
        mimeType: mimeType
      }
    });
  }

  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: history.concat({ role: 'user', parts: userParts }),
    config: {
      systemInstruction: SYSTEM_INSTRUCTIONS[lang],
    }
  });

  const response = await model;
  return response.text || "I'm sorry, I couldn't process that.";
}

export async function transcribeAudio(audioData: { data: string, mimeType: string }, lang: Language) {
  // Sanitize mimeType (e.g., remove codecs)
  const mimeType = audioData.mimeType.split(';')[0] || 'audio/webm';
  
  const transcriptionPrompt = lang === 'auto' 
    ? "Transcribe the following audio. Automatically detect the language (English, Hindi, Telugu, Kannada, Tamil, or Malayalam) and return only the transcription in that language. If there is no speech, return an empty string."
    : `Transcribe the following audio in ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'te' ? 'Telugu' : lang === 'kn' ? 'Kannada' : lang === 'ta' ? 'Tamil' : 'Malayalam'}. Return only the transcription. If there is no speech, return an empty string.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: 'user',
          parts: [
            { text: transcriptionPrompt },
            {
              inlineData: {
                data: audioData.data,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });

    return response.text || "";
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
}

export async function extractComplaintData(conversation: string, lang: Language) {
  const extractionPrompt = lang === 'auto'
    ? "Extract complaint details from this conversation. Detect the language used and return the summary in that same language. Return the data in JSON format."
    : `Extract complaint details from this conversation in ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'te' ? 'Telugu' : lang === 'kn' ? 'Kannada' : lang === 'ta' ? 'Tamil' : 'Malayalam'}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${extractionPrompt}
    Conversation: ${conversation}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          incidentType: { type: Type.STRING },
          description: { type: Type.STRING },
          location: { type: Type.STRING },
          incidentDate: { type: Type.STRING, description: "ISO 8601 format if possible" },
          aiSummary: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-bullet point summary of the incident for police officers"
          }
        },
        required: ["incidentType", "description", "location", "incidentDate", "aiSummary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return null;
  }
}

export async function detectDuplicates(description: string, existingComplaints: any[]) {
  if (existingComplaints.length === 0) return { isDuplicate: false };

  const existingDescriptions = existingComplaints.map(c => `ID: ${c.id}, Type: ${c.incidentType}, Desc: ${c.description}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following new complaint description and compare it with existing ones. Determine if it's a potential duplicate or part of a known trend.
    New Description: ${description}
    
    Existing Complaints:
    ${existingDescriptions}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isDuplicate: { type: Type.BOOLEAN },
          duplicateGroupId: { type: Type.STRING, description: "ID of the existing complaint if it's a duplicate" },
          reason: { type: Type.STRING }
        },
        required: ["isDuplicate"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { isDuplicate: false };
  }
}

export async function detectJurisdiction(lat: number, lng: number): Promise<{ stationName: string, district: string, state: string, contact?: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identify the specific local police station jurisdiction for the coordinates: ${lat}, ${lng}. 
      Return a JSON object with: stationName, district, state, and an optional contact number if available. 
      Be as precise as possible based on the location.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stationName: { type: Type.STRING },
            district: { type: Type.STRING },
            state: { type: Type.STRING },
            contact: { type: Type.STRING }
          },
          required: ["stationName", "district", "state"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Jurisdiction Detection Error:", error);
    return { stationName: "Local Police Station", district: "Unknown District", state: "Unknown State" };
  }
}

export async function findNearbyPoliceStations(lat: number, lng: number) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the exact names, addresses, and Google Maps links for at least 5 nearest police stations to the coordinates: ${lat}, ${lng}. 
      Ensure you provide real, existing police stations in the immediate vicinity. 
      Please list them clearly with their full names and addresses.`,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          includeServerSideToolInvocations: true,
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract stations from maps or web chunks
    let stations = groundingChunks
      .filter(chunk => chunk.maps || chunk.web)
      .map(chunk => ({
        title: chunk.maps?.title || chunk.web?.title || "Police Station",
        uri: chunk.maps?.uri || chunk.web?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chunk.maps?.title || chunk.web?.title || "Police Station")}`,
        address: chunk.maps?.placeAnswerSources?.[0]?.reviewSnippets?.[0] || "Nearby police station"
      }));

    // If no grounding chunks, try to extract from text using regex
    if (stations.length === 0 && response.text) {
      const lines = response.text.split('\n');
      const extracted: any[] = [];
      let currentStation: any = null;

      for (const line of lines) {
        // Look for patterns like "1. Station Name" or "**Station Name**"
        const titleMatch = line.match(/^\d+\.\s+\**([^*]+)\**/) || line.match(/^\*\s+\**([^*]+)\**/);
        if (titleMatch) {
          if (currentStation) extracted.push(currentStation);
          currentStation = {
            title: titleMatch[1].trim(),
            address: "Address found in text",
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(titleMatch[1].trim() + " Police Station")}`
          };
        } else if (currentStation && line.includes("Address:")) {
          currentStation.address = line.split("Address:")[1].trim();
        } else if (currentStation && (line.includes("http") || line.includes("goo.gl"))) {
          const urlMatch = line.match(/(https?:\/\/[^\s)]+)/);
          if (urlMatch) currentStation.uri = urlMatch[1];
        }
      }
      if (currentStation) extracted.push(currentStation);
      stations = extracted;
    }

    // Deduplicate by title
    const uniqueStations = Array.from(new Map(stations.map(s => [s.title.toLowerCase(), s])).values());

    return {
      text: response.text || "Here are the nearby police stations.",
      stations: uniqueStations.slice(0, 8) // Limit to 8
    };
  } catch (error) {
    console.error("Error finding nearby police stations:", error);
    return {
      text: "I couldn't find nearby police stations at the moment. Please try again or check your location settings.",
      stations: []
    };
  }
}
