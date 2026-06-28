const Groq = require('groq-sdk');
const relatedGroups = [
    ['Payment & Refunds', 'Order/Delivery Issues', 'Billing'],
    ['Account Issues', 'Security Issues', 'Data Privacy'],
    ['Bug Report', 'Technical Support', 'Performance Issues'],
    ['Product Issues', 'Feature Request']
];
const areRelated = (categories) => {
    return relatedGroups.some(group =>
        categories.every(cat => group.includes(cat))
    );
};

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const classifyTicket = async (description) => {
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an AI-powered support ticket classifier.
Analyze the ticket description and identify distinct issues ONLY if they are clearly unrelated to each other.
For each issue, classify it into ONE of these categories:
- Technical Support
- Billing
- Account Issues
- Bug Report
- Feature Request
- Security Issues
- Performance Issues
- Product Issues
- Order/Delivery Issues
- Payment & Refunds
- Data Privacy
- General Inquiry
Rules:
- If the description contains ONE issue OR multiple related issues, return ONLY the single most appropriate category as plain text
- ONLY split into multiple categories if the issues are completely unrelated (e.g. payment problem AND account locked)
- If splitting, return ONLY a JSON array like: ["Payment & Refunds", "Account Issues"]
- No explanations
- No extra text
- No markdown`
                },
                {
                    role: "user",
                    content: description
                }
            ]
        });

        const raw = completion.choices[0].message.content.trim();

if (raw.startsWith('[')) {

    const categories = JSON.parse(raw);

    if (areRelated(categories)) {
        return [categories[0]];
    }

    return categories;
}

        return [raw];

    } catch (error) {
        console.error("AI Classification Error:", error.message);
        return ["General Inquiry"];
    }
};

module.exports = classifyTicket;