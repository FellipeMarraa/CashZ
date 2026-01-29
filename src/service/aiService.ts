import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_KEY;

// Inicializa o SDK do Google
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const getDeepAnalysis = async (portfolioData: any) => {
    const prompt = `
        Aja como um Consultor de Investimentos Sênior. 
        Analise estes dados de carteira: ${JSON.stringify(portfolioData)}.
        
        Sua resposta deve:
        1. Avaliar se a alocação atual bate com o perfil informado.
        2. Identificar se o lucro/prejuízo está saudável.
        3. Dar uma dica prática de qual classe de ativo focar no próximo aporte. Indicando nomes de ativos e porcentagem de aporte.
        4. Ser curto (máximo 4 frases), direto e usar tom profissional.
        Responda em Português Brasileiro.
    `;

    // TENTATIVA 1: GEMINI via SDK Oficial
    try {
        console.log("Tentando Gemini via SDK oficial...");
        // Usando o modelo flash mais atual e estável de 2026
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return `${text}`;

    } catch (error) {
        console.warn("Gemini SDK falhou. Tentando Backup via Groq...", error);

        // TENTATIVA 2: GROQ (MANTENDO O QUE FUNCIONOU)
        try {
            const backupRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: "Você é um consultor financeiro sênior." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.5
                })
            });

            if (!backupRes.ok) throw new Error("Groq Offline");

            const backupData = await backupRes.json();
            const text = backupData.choices[0].message.content;
            return `${text}`;

        } catch (backupError) {
            console.error("Falha crítica em ambos provedores:", backupError);
            return "O Agente IA está descansando um pouco. Tente novamente em alguns minutos!";
        }
    }
};