import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const payload = req.body;

    try {
        const ctx = await createContext({ req, res } as any);
        const caller = appRouter.createCaller(ctx);

        // Forward payload to tally router
        await caller.feedback.handleTallyWebhook(payload);

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Tally Webhook Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
