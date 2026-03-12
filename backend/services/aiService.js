/**
 * AI Service - Simulates Transformer-based NLP with a keyword fallback.
 * In a production environment, this would call an external ML model (e.g., HuggingFace, OpenAI).
 */

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Access', 'Cloud', 'HR', 'Security', 'Infrastructure', 'Documentation'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const KEYWORDS = {
    Security: ['breach', 'password', 'hack', 'unauthorized', 'access denied', 'vulnerability', 'firewall'],
    Infrastructure: ['server', 'database', 'cloud', 'aws', 'azure', 'cluster', 'node', 'deployment'],
    Network: ['wifi', 'vpn', 'internet', 'connection', 'slow', 'offline', 'dns'],
    Hardware: ['printer', 'laptop', 'monitor', 'keyboard', 'broken', 'screen', 'power'],
    Software: ['bug', 'crash', 'error', 'feature', 'app', 'ui', 'frontend', 'backend']
};

const CRITICAL_KEYWORDS = ['outage', 'broken', 'breach', 'illegal', 'down', 'critical', 'urgent', 'asap', 'failed'];

/**
 * Perform AI Analysis on a ticket's title and description.
 */
exports.analyzeTicket = async (title, description) => {
    const text = `${title} ${description}`.toLowerCase();

    let predictedCategory = 'Unknown';
    let predictedPriority = 'Low';
    let explanation = [];
    let confidence = 0.5;

    // 1. Categorization Logic
    for (const [category, keywords] of Object.entries(KEYWORDS)) {
        const matches = keywords.filter(k => text.includes(k));
        if (matches.length > 0) {
            predictedCategory = category;
            explanation.push(`Detected keywords related to ${category}: ${matches.join(', ')}`);
            confidence += 0.1 * matches.length;
            break;
        }
    }

    // 2. Priority Logic
    const criticalMatches = CRITICAL_KEYWORDS.filter(k => text.includes(k));
    if (criticalMatches.length > 1 || text.includes('100% failure')) {
        predictedPriority = 'Urgent';
        explanation.push(`High urgency detected due to terms like: ${criticalMatches.join(', ')}`);
        confidence += 0.2;
    } else if (criticalMatches.length === 1) {
        predictedPriority = 'High';
        explanation.push(`Elevated priority based on term: ${criticalMatches[0]}`);
        confidence += 0.1;
    }

    // 3. SLA Risk Calculation
    let slaRisk = 0.1;
    if (predictedPriority === 'Urgent') slaRisk = 0.9;
    else if (predictedPriority === 'High') slaRisk = 0.6;
    else if (predictedPriority === 'Medium') slaRisk = 0.3;

    // 4. Solution Suggestion (New Automation Feature)
    const categorySolutions = {
        Security: "Reset user credentials and force MFA. Scan for anomalous IP activity in the security logs.",
        Infrastructure: "Check cloud instance health metrics. If CPU usage > 90%, trigger horizontal scaling or restart the service node.",
        Network: "Reboot local router if external pings fail. Check VPN tunnel status and re-verify client configuration.",
        Hardware: "Schedule a physical inspection or replacement if under warranty. Check for loose connections or power supply issues.",
        Software: "Clear application cache and restart. If error persists, check the latest deployment logs for regression."
    };

    let predictedSolution = categorySolutions[predictedCategory] || "Our AI is analyzing this issue. Initial recommendation: gather more logs and verify the problem with the user.";

    // Normalize confidence
    confidence = Math.min(0.99, confidence);

    return {
        aiCategory: predictedCategory,
        aiPriority: predictedPriority,
        aiConfidence: confidence,
        aiSlaRisk: slaRisk,
        aiExplanation: explanation,
        aiSolution: predictedSolution
    };
};
