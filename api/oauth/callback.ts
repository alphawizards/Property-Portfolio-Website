import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({ message: 'Missing code or state' });
    }

    try {
        const ctx = await createContext({ req, res } as any);
        // Decode state to get return URL or other info if needed
        // Assuming state contains JSON
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        } catch (e) {
            stateData = {};
        }

        // We need to exchange code for token. 
        // Typically this logic resides in auth router or oauth helper.
        // Let's assume we call a tRPC procedure to handle the exchange and login.

        // However, since this is a callback that needs to SET COOKIES and REDIRECT,
        // we might do it here.

        const caller = appRouter.createCaller(ctx);
        const result = await caller.auth.handleOAuthCallback({
            code: code as string,
            state: state as string // or stateData
        });

        // Start session
        // If result contains session token, set cookie
        if (result.token) {
            res.setHeader('Set-Cookie', `session=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`); // 30 days
        }

        // Redirect to dashboard or home
        return res.redirect('/');

    } catch (error) {
        console.error('OAuth Callback Error:', error);
        return res.redirect('/login?error=oauth_failed');
    }
}
