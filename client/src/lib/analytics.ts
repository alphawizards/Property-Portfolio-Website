type EventProperties = Record<string, string | number | boolean | null | undefined>;

/**
 * Tracks an analytics event.
 * @param eventName The name of the event (e.g., 'premium_gate_viewed')
 * @param properties Optional properties to attach to the event
 */
export function trackEvent(eventName: string, properties?: EventProperties) {
    // In a real app, this would send data to PostHog, Mixpanel, or Google Analytics.
    // For development/verification, we log to console.
    if (process.env.NODE_ENV === 'development') {
        console.groupCollapsed(`[Analytics] ${eventName}`);
        console.log('Properties:', properties);
        console.groupEnd();
    }

    // Placeholder for real implementation:
    // window.posthog?.capture(eventName, properties);
}
