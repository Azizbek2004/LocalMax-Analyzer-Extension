/**
 * Engine Configuration
 * Optimized defaults based on chess.com/Lichess best practices.
 */

export interface EngineConfig {
    threads: number;
    hash: number;       // MB
    depth: number;       // max depth for on-demand analysis
    multiPV: number;     // number of principal variations (for on-demand)
    moveTime: number;    // ms per position during full analysis
}

/**
 * Get optimized engine defaults based on hardware.
 * Uses movetime-based search for predictable analysis speed.
 */
export function getDefaultConfig(): EngineConfig {
    const cores = navigator.hardwareConcurrency || 4;
    // Use ~half of available cores for engine (leave room for UI and OS)
    const threads = Math.max(1, Math.min(6, Math.floor(cores / 2)));

    return {
        threads,
        hash: 128,          // 128MB is plenty for movetime-based analysis
        depth: 22,          // Fallback depth for on-demand analysis
        multiPV: 3,         // Show 3 lines when user clicks a move
        moveTime: 800,      // 800ms per position — 40 moves ≈ 33 seconds
    };
}

/**
 * Get low-end fallback config
 */
export function getLowEndConfig(): EngineConfig {
    return {
        threads: 1,
        hash: 64,
        depth: 18,
        multiPV: 2,
        moveTime: 500,      // Faster but shallower
    };
}

/**
 * Validate and clamp engine config
 */
export function validateConfig(config: Partial<EngineConfig>): EngineConfig {
    const defaults = getDefaultConfig();
    const cores = navigator.hardwareConcurrency || 4;

    return {
        threads: Math.max(1, Math.min(config.threads ?? defaults.threads, Math.max(1, cores - 1))),
        hash: Math.max(16, Math.min(config.hash ?? defaults.hash, 2048)),
        depth: Math.max(10, Math.min(config.depth ?? defaults.depth, 50)),
        multiPV: Math.max(1, Math.min(config.multiPV ?? defaults.multiPV, 5)),
        moveTime: Math.max(200, Math.min(config.moveTime ?? defaults.moveTime, 10000)),
    };
}
