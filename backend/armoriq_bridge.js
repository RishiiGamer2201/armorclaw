const express = require('express');
const { ArmorIQClient } = require('@armoriq/sdk');
const app = express();

app.use(express.json());

const apiKey = process.env.ARMORIQ_API_KEY || "ak_claw_4be328cac64d00e22a709f4707cd51f9e74df747edce5f511b174d139c392f2d";
const client = new ArmorIQClient({ 
    apiKey: apiKey,
    userId: "local_admin" 
});

app.post('/capture', async (req, res) => {
    try {
        const { intent, steps, risk_level } = req.body;
        
        let token = "token_not_generated";
        try {
            const captured = await client.capture_plan({
                intent,
                steps: steps || [],
                risk_level: risk_level || 'low'
            });
            token = captured.intent_token || captured.id || "success_token";
        } catch(e) {
            console.error("SDK warning:", e.message);
        }

        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 8001;
app.listen(PORT, () => {
    console.log(`ArmorIQ Javascript SDK Bridge running on port ${PORT}`);
});
