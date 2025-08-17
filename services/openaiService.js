import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export async function generateSummary(description) {
        try {
        const prompt = `Summarize the following description in 3-4 sentences:\n\n${description}`;

        const response = await fetch(
            'https://api-inference.huggingface.co/models/google/flan-t5-small',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: prompt })
            }
        );

        const text = await response.text(); // Flan-T5 returns plain text
        return text || "No summary generated";
    } catch (error) {
        console.error("Error generating summary via HuggingFace:", error);
        return null;
    }
}

